import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Receipt from "@/models/Receipt";
import { requireAdmin } from "@/lib/auth";

// Serves a customer's payment receipt image. Admin only — receipts are private.

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return new NextResponse("Not found", { status: 404 });
    }
    await connectDB();
    const receipt = await Receipt.findById(id).lean();
    if (!receipt) return new NextResponse("Not found", { status: 404 });

    const base64 = receipt.data.replace(/^data:[^;]+;base64,/, "");
    return new NextResponse(new Uint8Array(Buffer.from(base64, "base64")), {
      headers: {
        "Content-Type": receipt.contentType,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
