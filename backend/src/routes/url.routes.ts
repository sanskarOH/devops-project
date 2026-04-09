import { Router } from "express";
import { getStats, redirectToOriginal, shortenUrl } from "../controllers/url.controller";

export const urlRouter = Router();

urlRouter.post("/shorten", shortenUrl);
urlRouter.get("/stats/:code", getStats);
urlRouter.get("/:code", redirectToOriginal);
