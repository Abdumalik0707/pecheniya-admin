import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
  data: { type: String, required: true },
  contentType: { type: String, required: true },
  name: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const ImageModel = mongoose.models.Image || mongoose.model("Image", ImageSchema);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    // Validate ObjectId format to prevent NoSQL injection
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return new NextResponse("Not found", { status: 404 });
    }
    const img = await ImageModel.findById(id);
    if (!img) return new NextResponse("Not found", { status: 404 });

    const base64 = img.data.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": img.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
