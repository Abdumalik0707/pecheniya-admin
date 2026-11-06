import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { signToken, adminCookieHeader } from "@/lib/auth";
import { hit, peek, clear, clientIp } from "@/lib/rate-limit-db";

const MINUTE = 60_000;
const MAX_FAILS_PER_ACCOUNT = 5; // then locked for 15 minutes
const MAX_ATTEMPTS_PER_IP = 20; // per 10 minutes

// Compared against when the account doesn't exist, so the answer and the
// response time are the same for a wrong login and a wrong password.
const DUMMY_HASH = "$2b$12$Ba9p2v9ey7zg6Ra8f0STm.WYNBeF17nAdsMRmMQEFhxAnqEUu10TK";
const BAD_CREDENTIALS = "Login yoki parol noto'g'ri";

export async function POST(req: NextRequest) {
  try {
    if ((await hit(`admin-login-ip:${clientIp(req)}`, 10 * MINUTE)) > MAX_ATTEMPTS_PER_IP) {
      return NextResponse.json({ error: "Juda ko'p urinish. Birozdan keyin qayta urining." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    // only plain strings — objects like {"$ne": ""} would become Mongo operators
    const login = typeof body?.username === "string" ? body.username : typeof body?.phone === "string" ? body.phone : "";
    if (!login.trim() || typeof body?.password !== "string" || !body.password || body.password.length > 128) {
      return NextResponse.json({ error: "Login va parolni kiriting" }, { status: 400 });
    }

    const key = `admin-login-acct:${login.trim().toLowerCase().replace(/s/g, "")}`;
    if ((await peek(key)) >= MAX_FAILS_PER_ACCOUNT) {
      return NextResponse.json(
        { error: "Juda ko'p noto'g'ri urinish. 15 daqiqadan keyin qayta urining." },
        { status: 429 }
      );
    }

    await connectDB();
    const user = typeof body?.username === "string"
      ? await User.findOne({ username: body.username.trim() })
      : await User.findOne({ phone: { $in: [login.replace(/s/g, ""), login.trim()] } });

    const passwordOk = await bcrypt.compare(body.password, user?.password ?? DUMMY_HASH);
    const isAdmin = !!user && (user.isAdmin || user.type === "admin");

    // same answer for "no such user", "wrong password" and "not an admin"
    if (!user || !passwordOk || !isAdmin) {
      await hit(key, 15 * MINUTE);
      return NextResponse.json({ error: BAD_CREDENTIALS }, { status: 401 });
    }

    await clear(key);
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
