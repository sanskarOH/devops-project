import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/url_shortener",
  baseUrl: process.env.BASE_URL || "http://localhost:5000"
};
