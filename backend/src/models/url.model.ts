import mongoose, { Schema, Document } from "mongoose";

export interface IUrl extends Document {
  originalUrl: string;
  shortCode: string;
  clicks: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const urlSchema = new Schema<IUrl>(
  {
    originalUrl: { type: String, required: true },
    shortCode: { type: String, required: true, unique: true, index: true },
    clicks: { type: Number, default: 0 },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

export const Url = mongoose.model<IUrl>("Url", urlSchema);
