import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { urlRouter } from "./routes/url.routes";
import { errorHandler } from "./middleware/errorHandler";
import client from "prom-client";
export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
client.collectDefaultMetrics();

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.use("/", urlRouter);
app.use(errorHandler);
