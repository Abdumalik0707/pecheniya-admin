import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { phone, password, username } = await req.json();

    if ((!phone && !username) || !password) {
      return NextResponse.json({ error: "Telefon/Username va parolni kiriting" }, { status: 400 });
    }

    await connectDB();

    // Admin uchun username bilan kirish
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

    return NextResponse.json({
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
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
