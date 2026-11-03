import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const orders = await Order.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Xatolik";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const body = await req.json();

    if (!body.customerName || !body.customerPhone || !body.customerAddress) {
      return NextResponse.json(
        { success: false, error: "Mijoz ismi, telefon raqami va manzili majburiy" },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.products) || body.products.length === 0 || body.products.length > 50) {
      return NextResponse.json(
        { success: false, error: "Kamida bitta mahsulot kerak" },
        { status: 400 }
      );
    }

    const products = body.products.map((p: { productId?: unknown; productName?: unknown; quantity?: unknown; price?: unknown }) => ({
      productId: String(p.productId || "").slice(0, 100),
      productName: String(p.productName || "").trim().slice(0, 200),
      quantity: Math.min(10000, Math.max(1, Number(p.quantity) || 1)),
      price: Math.max(0, Number(p.price) || 0),
    }));

    const totalAmount = products.reduce((sum: number, p: { price: number; quantity: number }) => sum + p.price * p.quantity, 0);

    const safe = {
      customerName: String(body.customerName).trim().slice(0, 200),
      customerPhone: String(body.customerPhone).trim().slice(0, 30),
      customerAddress: String(body.customerAddress).trim().slice(0, 500),
      customerLat: typeof body.customerLat === "number" ? body.customerLat : undefined,
      customerLng: typeof body.customerLng === "number" ? body.customerLng : undefined,
      customerType: body.customerType === "shop" ? "shop" : "individual",
      products,
      totalAmount,
      status: ["yangi_mijoz", "tolov_otkazildi", "yetkazib_berishda", "yetkazib_berildi"].includes(body.status)
        ? body.status
        : "yangi_mijoz",
      paymentMethod: ["cash", "card", "online"].includes(body.paymentMethod) ? body.paymentMethod : undefined,
      notes: body.notes ? String(body.notes).trim().slice(0, 1000) : undefined,
    };

    const order = await Order.create(safe);
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Xatolik";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
