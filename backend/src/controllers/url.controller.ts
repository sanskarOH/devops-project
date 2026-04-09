import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { Url } from "../models/url.model";
import { env } from "../config/env";

const generateCode = (): string => crypto.randomBytes(5).toString("base64url").slice(0, 7);

export const shortenUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { url, expiresAt } = req.body;

    if (!url) {
      res.status(400).json({ message: "url is required" });
      return;
    }

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

    const shortCode = generateCode();
    const doc = await Url.create({
      originalUrl: url,
      shortCode,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    res.status(201).json({
      code: doc.shortCode,
      shortUrl: `${env.baseUrl}/${doc.shortCode}`,
      originalUrl: doc.originalUrl,
      expiresAt: doc.expiresAt ?? null
    });
  } catch (error) {
    next(error);
  }
};

export const redirectToOriginal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code } = req.params;
    const doc = await Url.findOne({ shortCode: code });

    if (!doc) {
      res.status(404).json({ message: "Short URL not found" });
      return;
    }

    if (doc.expiresAt && doc.expiresAt.getTime() < Date.now()) {
      res.status(410).json({ message: "Short URL expired" });
      return;
    }

    doc.clicks += 1;
    await doc.save();

    res.redirect(doc.originalUrl);
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      expiresAt: doc.expiresAt ?? null
    });
  } catch (error) {
    next(error);
  }
};
