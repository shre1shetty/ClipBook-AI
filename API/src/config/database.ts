import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log("MongoDB connected successfully");
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
