import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import dbConnect from "@/lib/db";
import Order, { IOrder } from "@/models/Order";

// Matches the "601 X-Printer 80mm" invoice layout the business uses.
// Each order becomes one block of ~14 header rows + a product table +
// totals + footer notes, separated by a blank row from the next block.

const COL_COUNT = 20; // A..T, same width as the sample sheet

function pad(arr: (string | number)[]): (string | number)[] {
  while (arr.length < COL_COUNT) arr.push("");
  return arr;
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n);
}

function fmtDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function invoiceNumber(id: string, createdAt: Date): string {
  // Short, human-readable: s_<yymmdd><last4ofid>
  const yy = String(createdAt.getFullYear()).slice(2);
  const mm = String(createdAt.getMonth() + 1).padStart(2, "0");
  const dd = String(createdAt.getDate()).padStart(2, "0");
  const tail = id.slice(-5).toUpperCase();
  return `s_${yy}${mm}${dd}${tail}`;
}

function buildBlock(order: IOrder): (string | number)[][] {
  const rows: (string | number)[][] = [];
  const created = new Date(order.createdAt);

  // Header
  rows.push(pad(["SmaG"]));
  rows.push(pad([`Номер накладной: ${invoiceNumber(String(order._id), created)}`]));
  rows.push(pad([`Дата накладной: ${fmtDate(created)}`]));
  rows.push(pad([`Менеджер: Admin`]));
  rows.push(pad([`Номер телефона: +998 95 839 19 19`]));
  rows.push(
    pad([
      order.customerType === "shop"
        ? `Магазин: ${order.customerName}`
        : `Мижоз: ${order.customerName}`,
    ])
  );
  rows.push(pad([`Номер телефона: ${order.customerPhone}`]));
  rows.push(pad([`Адрес: ${order.customerAddress}`]));
  rows.push(pad([`Способ оплаты: ${
    order.paymentMethod === "cash"
      ? "Наличные"
      : order.paymentMethod === "card"
      ? "Карта"
      : order.paymentMethod === "online"
      ? "Онлайн"
      : "—"
  }`]));
  rows.push(pad([`Статус: ${
    order.status === "yangi_mijoz"
      ? "Новый заказ"
      : order.status === "tolov_otkazildi"
      ? "Оплата произведена"
      : order.status === "yetkazib_berishda"
      ? "В доставке"
      : "Доставлено"
  }`]));
  rows.push(pad([""]));

  // Table header — columns match the sample's layout:
  // A=№, B=Товар, G=Бл, J=Кол, M=Цена, Q=Сумма
  const headerRow: (string | number)[] = new Array(COL_COUNT).fill("");
  headerRow[0] = "№";
  headerRow[1] = "Товар";
  headerRow[6] = "Бл";
  headerRow[9] = "Кол";
  headerRow[12] = "Цена";
  headerRow[16] = "Сумма";
  rows.push(headerRow);

  // Category label (grouping) — if products have a shared series, use it;
  // otherwise just "Печенье"
  rows.push(pad(["Печенье"]));

  // Products
  let totalBl = 0;
  let totalKol = 0;
  let totalSum = 0;
  order.products.forEach((p, idx) => {
    const bl = p.quantity;
    const kol = p.quantity;
    const sum = p.quantity * p.price;
    totalBl += bl;
    totalKol += kol;
    totalSum += sum;
    const r: (string | number)[] = new Array(COL_COUNT).fill("");
    r[0] = idx + 1;
    r[1] = p.productName;
    r[6] = bl;
    r[9] = kol;
    r[12] = fmtMoney(p.price);
    r[16] = fmtMoney(sum);
    rows.push(r);
  });

  // Totals rows
  const itogoRow: (string | number)[] = new Array(COL_COUNT).fill("");
  itogoRow[0] = "Итого";
  itogoRow[6] = totalBl;
  itogoRow[9] = totalKol;
  itogoRow[16] = fmtMoney(totalSum);
  rows.push(itogoRow);

  const grandRow: (string | number)[] = new Array(COL_COUNT).fill("");
  grandRow[0] = "Общий итог";
  grandRow[6] = totalBl;
  grandRow[9] = totalKol;
  grandRow[16] = fmtMoney(totalSum);
  rows.push(grandRow);

  rows.push(pad([`Примечение: ${order.notes || ""}`]));
  rows.push(pad([`Комментарий: `]));
  rows.push(pad([""])); // separator

  return rows;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) {
      return NextResponse.json(
        { success: false, error: "Hech bo'lmasa bitta buyurtma tanlang" },
        { status: 400 }
      );
    }

    const orders = (await Order.find({ _id: { $in: ids } })
      .sort({ createdAt: -1 })
      .lean()) as unknown as IOrder[];

    if (!orders.length) {
      return NextResponse.json(
        { success: false, error: "Buyurtmalar topilmadi" },
        { status: 404 }
      );
    }

    // Build sheet
    const allRows: (string | number)[][] = [];
    for (const o of orders) {
      for (const row of buildBlock(o)) allRows.push(row);
    }
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Column widths similar to sample
    ws["!cols"] = [
      { wch: 6 },   // № (A)
      { wch: 24 },  // Товар name start (B)
      { wch: 3 }, { wch: 3 }, { wch: 3 }, { wch: 3 }, // C-F (part of Товар)
      { wch: 6 },   // Бл (G)
      { wch: 3 }, { wch: 3 }, // H-I
      { wch: 7 },   // Кол (J)
      { wch: 3 }, { wch: 3 }, // K-L
      { wch: 11 },  // Цена (M)
      { wch: 3 }, { wch: 3 }, { wch: 3 }, // N-P
      { wch: 13 },  // Сумма (Q)
      { wch: 3 }, { wch: 3 }, { wch: 3 }, // R-T
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Накладная 80mm");
    const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const date = new Date();
    const stamp = `${fmtDate(date)}_${String(date.getHours()).padStart(2, "0")}-${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
    const filename = `SmaG X-Printer 80mm - ${stamp}.xlsx`;

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Xatolik";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
