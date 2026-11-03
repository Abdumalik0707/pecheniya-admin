import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await connectDB();
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ success: false, error: "Noto'g'ri ID" }, { status: 400 });
    }
    const product = await Product.findById(id).lean();
    if (!product) return NextResponse.json({ success: false, error: "Topilmadi" }, { status: 404 });
    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Xatolik";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await connectDB();
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ success: false, error: "Noto'g'ri ID" }, { status: 400 });
    }
    const body = await req.json();

    if (body.price !== undefined) body.price = Math.max(0, Number(body.price) || 0);
    if (body.shopPrice !== undefined) body.shopPrice = Math.max(0, Number(body.shopPrice) || 0);

    if (body.image && (!body.images || body.images.length === 0)) {
      body.images = [body.image];
    }

    const product = await Product.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!product) return NextResponse.json({ success: false, error: "Topilmadi" }, { status: 404 });
    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Xatolik";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await connectDB();
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ success: false, error: "Noto'g'ri ID" }, { status: 400 });
    }
    const product = await Product.findByIdAndDelete(id);
    if (!product) return NextResponse.json({ success: false, error: "Topilmadi" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Xatolik";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
