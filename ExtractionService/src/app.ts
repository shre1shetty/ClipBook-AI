import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { extractionRouter } from "./routes/extraction.route.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();
dotenv.config();

const corsOpts = {
  origin: process.env.CLIENT_URL?.split(",") || "http://localhost:5173",
  methods: ["GET", "POST"],
};

app.use(helmet());
app.use(express.json());
app.use(cors(corsOpts));

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/extraction", extractionRouter);

app.use(errorHandler);

export default app;
