import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken, signToken, adminCookieHeader } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Must be authenticated admin
  const auth = await verifyToken(req);
  if (!auth) {
    return NextResponse.json({ error: "Avtorizatsiya talab qilinadi" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword, newUsername } = await req.json();

    if (!currentPassword) {
      return NextResponse.json({ error: "Joriy parolni kiriting" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(auth.sub);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Admin topilmadi" }, { status: 404 });
    }

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return NextResponse.json({ error: "Joriy parol noto'g'ri" }, { status: 401 });
    }

    // Update username if provided
    if (newUsername && newUsername.trim() !== user.username) {
      const trimmed = String(newUsername).trim().slice(0, 50);
      if (trimmed.length < 3) {
        return NextResponse.json({ error: "Username kamida 3 belgi bo'lishi kerak" }, { status: 400 });
      }
      // Check uniqueness
      const existing = await User.findOne({ username: trimmed, _id: { $ne: user._id } });
      if (existing) {
        return NextResponse.json({ error: "Bu username band" }, { status: 409 });
      }
      user.username = trimmed;
    }

    // Update password if provided
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Yangi parol kamida 6 belgi bo'lishi kerak" }, { status: 400 });
      }
      if (newPassword.length > 128) {
        return NextResponse.json({ error: "Parol juda uzun" }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 12);
    }

    await user.save();

    // Re-sign token (in case username changed etc.)
    const token = await signToken(String(user._id), true);
    const res = NextResponse.json({
      success: true,
      message: "Sozlamalar saqlandi",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
      },
    });
    res.headers.set("Set-Cookie", adminCookieHeader(token));
    return res;
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
