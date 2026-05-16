import mongoose from "mongoose";
import { config } from "../../config";

export async function connectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(config.mongodb.uri);
  }
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
