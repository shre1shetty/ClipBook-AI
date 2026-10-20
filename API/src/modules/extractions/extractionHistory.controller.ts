import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/AppError.js";
import type { AuthenticatedRequest } from "../../middleware/authenticate.js";
import {
  listExtractionHistory,
  getExtractionHistoryById,
  deleteExtractionHistory,
} from "./extractionHistory.service.js";
import { getUserId, parsePositiveInteger } from "../../util/util.js";

export async function getExtractionHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20);

    const result = await listExtractionHistory(getUserId(req), page, limit);

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getExtractionHistoryItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const extraction = await getExtractionHistoryById(
      getUserId(req),
      req.params.extractionId?.toString(),
    );

    res.status(200).json({ success: true, extraction });
  } catch (error) {
    next(error);
  }
}

export async function removeExtractionHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteExtractionHistory(
      getUserId(req),
      req.params.extractionId?.toString(),
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
