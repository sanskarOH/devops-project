import mongoose from "mongoose";
import { logger } from "../utils/logger";

export const connectDB = async (uri: string): Promise<void> => {
  try {
    await mongoose.connect(uri);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("MongoDB connection failed", error);
    process.exit(1);
  }
};
