import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { Url } from "../models/url.model";
import { env } from "../config/env";

// Generate short code
const generateCode = (): string =>
  crypto.randomBytes(5).toString("base64url").slice(0, 7);

// Ensure unique short code (avoid collisions)
const generateUniqueCode = async (): Promise<string> => {
  let code: string;
  let exists;

  do {
    code = generateCode();
    exists = await Url.findOne({ shortCode: code });
  } while (exists);

  return code;
};

// Create short URL
export const shortenUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { url, expiresAt } = req.body;

    if (!url) {
      res.status(400).json({ message: "url is required" });
      return;
    }

    // Validate URL
    let parsed: URL;
    try {
      parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      res.status(400).json({ message: "Invalid URL format" });
      return;
    }

    // 👉 If NO expiry → reuse existing
    if (!expiresAt) {
      const existing = await Url.findOne({
        originalUrl: url,
        expiresAt: null,
      });

      if (existing) {
        res.status(200).json({
          code: existing.shortCode,
          shortUrl: `${env.baseUrl}/${existing.shortCode}`,
          originalUrl: existing.originalUrl,
          expiresAt: null,
        });
        return;
      }
    }

    // 👉 Create new short URL
    const shortCode = await generateUniqueCode();

    const doc = await Url.create({
      originalUrl: url,
      shortCode,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    res.status(201).json({
      code: doc.shortCode,
      shortUrl: `${env.baseUrl}/${doc.shortCode}`,
      originalUrl: doc.originalUrl,
      expiresAt: doc.expiresAt ?? null,
    });
  } catch (error) {
    next(error);
  }
};

// Redirect to original URL
export const redirectToOriginal = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { code } = req.params;

    const doc = await Url.findOne({ shortCode: code });

    if (!doc) {
      res.status(404).json({ message: "Short URL not found" });
      return;
    }

    // Check expiry
    if (doc.expiresAt && doc.expiresAt.getTime() < Date.now()) {
      res.status(410).json({ message: "Short URL expired" });
      return;
    }

    // Increment clicks
    doc.clicks += 1;
    await doc.save();

    res.redirect(doc.originalUrl);
  } catch (error) {
    next(error);
  }
};

// Get stats
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { code } = req.params;

    const doc = await Url.findOne({ shortCode: code });

    if (!doc) {
      res.status(404).json({ message: "Short URL not found" });
      return;
    }

    res.json({
      code: doc.shortCode,
      originalUrl: doc.originalUrl,
      clicks: doc.clicks,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt ?? null,
    });
  } catch (error) {
    next(error);
  }
};
