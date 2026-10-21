import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null;
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | null;
}

let cached = global._mongooseConn;
let promise = global._mongoosePromise;

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (cached) return cached;

  if (!promise) {
    promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    global._mongoosePromise = promise;
  }

  cached = await promise;
  global._mongooseConn = cached;
  return cached;
}
