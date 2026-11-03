import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, adminCookieHeader } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 attempts per minute per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = rateLimit(`admin-login:${ip}`, { limit: 5, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Juda ko'p urinish. 1 daqiqa kuting." },
        { status: 429 }
      );
    }

    const { phone, password, username } = await req.json();

    if ((!phone && !username) || !password) {
      return NextResponse.json(
        { error: "Telefon/Username va parolni kiriting" },
        { status: 400 }
      );
    }

    await connectDB();

    let user;
    if (username) {
      user = await User.findOne({ username });
    } else {
      user = await User.findOne({ phone });
    }

    if (!user) {
      return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: "Parol noto'g'ri" }, { status: 401 });
    }

    // Only admins can use the admin panel
    if (!user.isAdmin && user.type !== "admin") {
      return NextResponse.json({ error: "Admin huquqi yo'q" }, { status: 403 });
    }

    // Sign JWT and set httpOnly cookie
    const token = await signToken(String(user._id), true);
    const res = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        username: user.username,
        type: user.type,
        shopName: user.shopName,
        isAdmin: user.isAdmin,
      },
    });
    res.headers.set("Set-Cookie", adminCookieHeader(token));
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
