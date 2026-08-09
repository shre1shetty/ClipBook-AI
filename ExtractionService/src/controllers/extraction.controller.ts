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
