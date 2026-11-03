import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Admin yaratish — faqat ADMIN_SETUP_SECRET bilan ishlaydi.
 * Uni ishlatish uchun Vercel environment variable qo'shing:
 *   ADMIN_SETUP_SECRET=<sizning_maxfiy_kalitingiz>
 * So'ng: POST /api/auth/create-admin  body: { secret: "..." }
 *
 * GET — bloklangan (eski ochiq endpoint edi)
 */

export async function GET() {
  return NextResponse.json(
    { error: "Bu endpoint o'chirilgan. POST ishlating." },
    { status: 405 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { secret, username, password } = await req.json();
    const setupSecret = process.env.ADMIN_SETUP_SECRET;

    if (!setupSecret || secret !== setupSecret) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }

    await connectDB();

    const adminUser = username || "admin";
    const adminPass = password || "admin1234";

    const existing = await User.findOne({ username: adminUser });
    if (existing) {
      return NextResponse.json({ error: "Admin allaqachon mavjud" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(adminPass, 12);

    const admin = await User.create({
      name: "Admin",
      phone: "+998901234567",
      username: adminUser,
      password: hashed,
      type: "admin",
      isAdmin: true,
    });

    return NextResponse.json({
      success: true,
      message: "Admin yaratildi",
      user: { username: admin.username, type: admin.type },
    });
  } catch (err) {
    console.error("Create admin error:", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
