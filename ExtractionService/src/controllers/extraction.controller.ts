import { ExtractionService } from "../service/extraction.service.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { Request, Response } from "express";
const extractionService = new ExtractionService();

export const extractText = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError("Image is required", 400);
  }
  const result = await extractionService.extractText(req.file.buffer);
  res.status(200).json({
    success: true,
    result,
  });
});

export const extractTextFromUrl = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.body.url) {
      throw new AppError("URL is required", 400);
    }
    const result = await extractionService.extractTextFromUrl(req.body.url);
    res.status(200).json({
      success: true,
      result,
    });
  },
);
