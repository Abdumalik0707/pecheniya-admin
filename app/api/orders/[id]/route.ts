import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ success: false, error: "Noto'g'ri ID" }, { status: 400 });
    }
    await dbConnect();
    const body = await req.json();

    // Only allow safe fields to be updated
    const allowed: Record<string, unknown> = {};
    if (body.status) allowed.status = body.status;
    if (body.paymentMethod) allowed.paymentMethod = body.paymentMethod;
    if (body.notes !== undefined) allowed.notes = String(body.notes).slice(0, 2000);

    const order = await Order.findByIdAndUpdate(id, allowed, { new: true });
    if (!order) {
      return NextResponse.json({ success: false, error: "Buyurtma topilmadi" }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Xatolik";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ success: false, error: "Noto'g'ri ID" }, { status: 400 });
    }
    await dbConnect();
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Buyurtma topilmadi" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Xatolik";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
