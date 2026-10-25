import cors from "cors";
import helmet from "helmet";
import express from "express";
import { env } from "./config/env.js";
import { isDatabaseReady } from "./config/database.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import authRouter from "./modules/auth/auth.routes.js";
import extractionHistoryRoutes from "./modules/extractions/extractionHistory.routes.js";
import notebookRouter from "./modules/notebooks/notebook.routes.js";
const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

app.use(express.json({ limit: "1mb" }));

app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    service: "clipbook-main-api",
  });
});

app.get("/health/ready", (req, res) => {
  const databaseReady = isDatabaseReady();

  res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    status: databaseReady ? "ready" : "not_ready",
    dependencies: {
      mongodb: databaseReady ? "connected" : "disconnected",
    },
  });
});

// Useful during development; can be replaced with structured logging later.
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api/auth", authRouter);
app.use("/api/extractions", extractionHistoryRoutes);
app.use("/api/notebooks", notebookRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
