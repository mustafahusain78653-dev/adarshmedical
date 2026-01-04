import mongoose from "mongoose";
import { env } from "@/lib/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cached;

export async function connectDb() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.MONGODB_URI(), {
        autoIndex: true,
      })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}


