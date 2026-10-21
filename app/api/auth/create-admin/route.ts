import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    // Admin allaqachon mavjudligini tekshirish
    const existingAdmin = await User.findOne({ username: "admin" });
    if (existingAdmin) {
      return NextResponse.json({ error: "Admin allaqachon mavjud" }, { status: 400 });
    }

    // Admin parolini hash qilish
    const hashedPassword = await bcrypt.hash("admin1234", 10);

    // Admin yaratish
    const admin = await User.create({
      name: "Admin",
      phone: "+998901234567",
      username: "admin",
      password: hashedPassword,
      type: "admin",
      isAdmin: true,
    });

    return NextResponse.json({
      success: true,
      message: "Admin muvaffaqiyatli yaratildi",
      user: {
        username: admin.username,
        type: admin.type,
      },
    });
  } catch (err) {
    console.error("Create admin error:", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
