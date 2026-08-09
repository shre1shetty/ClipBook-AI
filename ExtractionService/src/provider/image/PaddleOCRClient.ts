import { PaddleOCRClient } from "@paddleocr/api-sdk";

export const paddleOCRClient = new PaddleOCRClient({
  token: process.env.PADDLEOCR_ACCESS_TOKEN_DEV || "",
  requestTimeout: 300_000,
  pollTimeout: 600_000,
});
