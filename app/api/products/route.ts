import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { requireAdmin } from "@/lib/auth";
import { defaultShopPrice } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, products });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Xatolik";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await connectDB();
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.price || !body.image || !body.categoryLabel || !body.weight) {
      return NextResponse.json(
        { success: false, error: "Nomi, narxi, rasmi, kategoriyasi va og'irligi majburiy" },
        { status: 400 }
      );
    }

    // Sanitize: only allow known fields
    const safe = {
      name: String(body.name).trim().slice(0, 200),
      brand: String(body.brand || "SmaG").trim().slice(0, 100),
      category: String(body.category || "pechenye").trim(),
      categoryLabel: String(body.categoryLabel).trim().slice(0, 100),
      price: Math.max(0, Number(body.price) || 0),
      shopPrice: Math.max(0, Number(body.shopPrice) || 0) || defaultShopPrice(Math.max(0, Number(body.price) || 0)),
      weight: String(body.weight).trim().slice(0, 50),
      netWeight: String(body.netWeight || "").trim().slice(0, 50),
      unit: String(body.unit || "quti").trim(),
      image: String(body.image),
      images: Array.isArray(body.images) ? body.images.map(String).slice(0, 10) : [String(body.image)],
      description: String(body.description || "").slice(0, 1000),
      descriptionFull: String(body.descriptionFull || "").slice(0, 5000),
      tags: Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t).slice(0, 50)).slice(0, 20) : [],
      isNew: Boolean(body.isNew),
      isPremium: Boolean(body.isPremium),
    };

    const product = await Product.create(safe);
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Xatolik";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
