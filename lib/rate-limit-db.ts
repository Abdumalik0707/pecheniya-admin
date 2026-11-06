import mongoose, { Schema } from "mongoose";
import { connectDB } from "@/lib/mongodb";

/*  Database-backed counters (login attempts etc.).
 *  The in-memory limiter in rate-limit.ts resets on every serverless cold
 *  start and is not shared between instances, so it can't stop a slow
 *  password-guessing script. These counters live in MongoDB and expire on
 *  their own (TTL index on expiresAt).
 */

const ThrottleSchema = new Schema(
  { _id: String, count: { type: Number, default: 0 }, expiresAt: { type: Date, index: { expires: 0 } } },
  { versionKey: false }
);
const Throttle = mongoose.models.Throttle || mongoose.model("Throttle", ThrottleSchema);

/** Count one event for `key`; returns how many happened in the current window. */
export async function hit(key: string, windowMs: number): Promise<number> {
  await connectDB();
  const now = new Date();
  const doc = await Throttle.findOneAndUpdate(
    { _id: key, expiresAt: { $gt: now } },
    { $inc: { count: 1 } },
    { new: true }
  ).lean<{ count: number }>();
  if (doc) return doc.count;
  try {
    await Throttle.updateOne(
      { _id: key },
      { $set: { count: 1, expiresAt: new Date(now.getTime() + windowMs) } },
      { upsert: true }
    );
  } catch {
    /* concurrent first hit — the other request created the window */
  }
  return 1;
}

/** How many events are counted for `key` right now (0 if the window is over). */
export async function peek(key: string): Promise<number> {
  await connectDB();
  const doc = await Throttle.findOne({ _id: key, expiresAt: { $gt: new Date() } }).lean<{ count: number }>();
  return doc?.count ?? 0;
}

export async function clear(key: string): Promise<void> {
  await connectDB();
  await Throttle.deleteOne({ _id: key });
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
