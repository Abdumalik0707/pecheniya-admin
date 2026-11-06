import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

/*  ─── JWT-based admin auth ──────────────────────────────────────────
 *  On login the server sets an httpOnly cookie with a signed JWT.
 *  Every protected route calls requireAdmin() which verifies it.
 *  The token lives 7 days; the cookie is httpOnly + Secure + SameSite.
 */

const ALG = "HS256";
const TOKEN_NAME = "smag_admin_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    console.warn("[security] JWT_SECRET is not set — sessions are signed with a key derived from MONGODB_URI. Set JWT_SECRET.");
  }
  const raw = process.env.JWT_SECRET || process.env.MONGODB_URI || "";
  return new TextEncoder().encode(raw.slice(0, 64));
}

/** Create a signed JWT for the given admin user id */
export async function signToken(userId: string, isAdmin: boolean): Promise<string> {
  return new SignJWT({ sub: userId, admin: isAdmin })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

/** Verify the JWT from the request cookies. Returns { sub, admin } or null. */
export async function verifyToken(
  req: NextRequest
): Promise<{ sub: string; admin: boolean } | null> {
  const cookie = req.cookies.get(TOKEN_NAME);
  if (!cookie?.value) return null;

  try {
    const { payload } = await jwtVerify(cookie.value, getSecret(), {
      algorithms: [ALG],
    });
    if (!payload.sub || !payload.admin) return null;
    return { sub: payload.sub as string, admin: payload.admin as boolean };
  } catch {
    return null;
  }
}

/** Return a 401 JSON response */
function unauthorized() {
  return NextResponse.json(
    { success: false, error: "Avtorizatsiya talab qilinadi" },
    { status: 401 }
  );
}

/** Guard: returns null if the request is from a verified admin,
 *  otherwise returns a 401 NextResponse you must return from the handler. */
export async function requireAdmin(
  req: NextRequest
): Promise<NextResponse | null> {
  const auth = await verifyToken(req);
  if (!auth) return unauthorized();
  return null; // caller proceeds
}

/** Build the Set-Cookie header value for the admin token */
export function adminCookieHeader(token: string): string {
  const parts = [
    `${TOKEN_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${MAX_AGE}`,
  ];
  // Secure flag only in production (HTTPS)
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

/** Build a Set-Cookie that clears the token */
export function clearAdminCookie(): string {
  return `${TOKEN_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
