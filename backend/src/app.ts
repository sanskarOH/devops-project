import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { urlRouter } from "./routes/url.routes";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/", urlRouter);
app.use(errorHandler);
