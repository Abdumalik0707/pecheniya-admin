/*  Simple in-memory rate limiter for serverless.
 *  Each Vercel function instance keeps its own map; on cold start the map
 *  is empty. This stops scripted brute-force without external dependencies.
 */

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 } = {}
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  entry.count++;
  if (entry.count > limit) {
    return { ok: false, remaining: 0 };
  }
  return { ok: true, remaining: limit - entry.count };
}
