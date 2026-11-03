import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import dbConnect from "@/lib/db";
import Order, { IOrder } from "@/models/Order";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";

// SmaG накладная — 80mm receipt layout:
// Товар | Кор | Кг/кор | Цена/кг | Сумма

const COMPANY = "SmaG";
const MONEY = "# ##0";
const KG = "0.0";

const THIN = { style: "thin" as const, color: { argb: "FF000000" } };
const BOX = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const DASHES = "-".repeat(45);

function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** "3.5 kg" | "3,5 kg" | "500 g" -> kilograms */
function parseKg(weight?: string): number {
  if (!weight) return 0;
  const m = weight.replace(",", ".").match(/([\d.]+)\s*(kg|кг|g|г)?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (!isFinite(n)) return 0;
  const unit = (m[2] || "kg").toLowerCase();
  return unit === "g" || unit === "г" ? n / 1000 : n;
}

function writeOrder(
  ws: ExcelJS.Worksheet,
  order: IOrder,
  weightOf: (line: { productId: string; productName: string }) => number,
  startRow: number
): number {
  let r = startRow;

  const bandRow = (text: string, opts: Partial<ExcelJS.Font> = {}, align: "left" | "center" = "left", h = 16) => {
    ws.mergeCells(r, 1, r, 5);
    const c = ws.getCell(r, 1);
    c.value = text;
    c.font = { size: 10, ...opts };
    c.alignment = { horizontal: align, vertical: "middle" };
    ws.getRow(r).height = h;
    r++;
  };

  // ---- Header ----
  bandRow(COMPANY, { size: 22, bold: true, name: "Times New Roman" }, "center", 32);
  bandRow("НАКЛАДНАЯ", { size: 12, bold: true }, "center", 20);
  ws.getRow(r).height = 6;
  r++;

  bandRow(`Дата: ${fmtDate(new Date(order.createdAt))}`, { bold: true });
  bandRow(`Клиент: ${order.customerName}`, { bold: true });
  bandRow(`Телефон: ${order.customerPhone}`, { bold: true });
  bandRow(DASHES, { size: 9 });

  // ---- Table header ----
  const head = ws.getRow(r);
  ["Товар", "Кор", "Кг/кор", "Цена/кг", "Сумма"].forEach((text, i) => {
    const c = head.getCell(i + 1);
    c.value = text;
    c.font = { bold: true, size: 10 };
    c.alignment = { horizontal: "center", vertical: "middle" };
    c.border = BOX;
  });
  head.height = 20;
  r++;

  // ---- Product lines ----
  let totalSum = 0;
  for (const p of order.products) {
    const kgPerBox = weightOf(p);
    const sum = p.quantity * p.price;
    totalSum += sum;

    const row = ws.getRow(r);
    row.getCell(1).value = p.productName;
    row.getCell(2).value = p.quantity;
    row.getCell(3).value = kgPerBox || null;
    row.getCell(4).value = kgPerBox ? p.price / kgPerBox : null;
    row.getCell(5).value = sum;

    row.getCell(1).alignment = { horizontal: "left", vertical: "middle", wrapText: true, indent: 1 };
    row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(4).alignment = { horizontal: "right", vertical: "middle", indent: 1 };
    row.getCell(5).alignment = { horizontal: "right", vertical: "middle", indent: 1 };

    row.getCell(3).numFmt = KG;
    row.getCell(4).numFmt = MONEY;
    row.getCell(5).numFmt = MONEY;

    for (let c = 1; c <= 5; c++) {
      row.getCell(c).font = { size: 10 };
      row.getCell(c).border = BOX;
    }
    row.height = 22;
    r++;
  }

  // ---- Total ----
  ws.mergeCells(r, 1, r, 4);
  const tot = ws.getRow(r);
  tot.getCell(1).value = "ИТОГО:";
  tot.getCell(5).value = totalSum;
  tot.getCell(1).alignment = { horizontal: "right", vertical: "middle", indent: 1 };
  tot.getCell(5).alignment = { horizontal: "right", vertical: "middle", indent: 1 };
  tot.getCell(5).numFmt = MONEY;
  for (let c = 1; c <= 5; c++) {
    tot.getCell(c).font = { bold: true, size: 11 };
    tot.getCell(c).border = BOX;
  }
  tot.height = 22;
  r++;

  // ---- Footer ----
  bandRow(DASHES, { size: 9 });
  bandRow("Подпись: __________________________", { bold: true }, "left", 24);

  ws.getRow(r).height = 24;
  r++;

  return r;
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

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

    // Orders store either a Mongo _id or a site slug, so resolve the box weight
    // by id first and fall back to the product name.
    const allLines = orders.flatMap((o) => o.products);
    const objectIds = [...new Set(allLines.map((p) => p.productId))].filter((id) =>
      /^[0-9a-fA-F]{24}$/.test(id)
    );
    const names = [...new Set(allLines.map((p) => p.productName))];

    const products = await Product.find({
      $or: [{ _id: { $in: objectIds } }, { name: { $in: names } }],
    })
      .select("_id name weight")
      .lean();

    const kgById = new Map<string, number>();
    const kgByName = new Map<string, number>();
    for (const p of products as { _id: unknown; name?: string; weight?: string }[]) {
      const kg = parseKg(p.weight);
      kgById.set(String(p._id), kg);
      if (p.name) kgByName.set(p.name, kg);
    }

    const weightOf = (line: { productId: string; productName: string }) =>
      kgById.get(line.productId) ?? kgByName.get(line.productName) ?? 0;

    const wb = new ExcelJS.Workbook();
    wb.creator = COMPANY;
    wb.created = new Date();

    const ws = wb.addWorksheet("Чек 80mm", {
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    ws.columns = [
      { width: 28 }, // Товар
      { width: 8 },  // Кор
      { width: 10 }, // Кг/кор
      { width: 13 }, // Цена/кг
      { width: 15 }, // Сумма
    ];

    let row = 1;
    for (const order of orders) {
      row = writeOrder(ws, order, weightOf, row);
    }

    const buf = await wb.xlsx.writeBuffer();

    const now = new Date();
    const p2 = (n: number) => String(n).padStart(2, "0");
    const stamp = `${p2(now.getDate())}.${p2(now.getMonth() + 1)}.${now.getFullYear()} ${p2(
      now.getHours()
    )}_${p2(now.getMinutes())}_${p2(now.getSeconds())}`;
    const filename = `SmaG_nakladnoy_601_80mm - ${stamp} - Чек 80mm.xlsx`;

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
