import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/auth";

// Uploads are compressed before they reach MongoDB: a 1.5 MB phone photo would
// otherwise become ~2 MB of base64 and eat the 512 MB free tier within a few
// hundred products.

const MAX_WIDTH = 1400;
const MAX_UPLOAD = 15 * 1024 * 1024;

const ImageSchema = new mongoose.Schema({
  data: { type: String, required: true },
  contentType: { type: String, required: true },
  name: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const ImageModel = mongoose.models.Image || mongoose.model("Image", ImageSchema);

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await connectDB();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fayl tanlanmadi" }, { status: 400 });
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Faqat JPG, PNG, WEBP" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD) {
      return NextResponse.json({ error: "Rasm 15MB dan katta" }, { status: 400 });
    }

    const original = Buffer.from(await file.arrayBuffer());

    const optimized = await sharp(original)
      .rotate() // honour EXIF orientation from phone cameras
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const dataUri = `data:image/webp;base64,${optimized.toString("base64")}`;

    const img = await ImageModel.create({
      data: dataUri,
      contentType: "image/webp",
      name: file.name,
    });

    return NextResponse.json({
      success: true,
      url: `/api/upload/${img._id}`,
      originalKb: Math.round(original.length / 1024),
      storedKb: Math.round(optimized.length / 1024),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Xatolik";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
