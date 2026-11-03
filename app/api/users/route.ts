import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await dbConnect();
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return NextResponse.json({ success: true, users, count: users.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Xatolik";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
