import { Types } from "mongoose";
import { AppError } from "../../shared/errors/AppError.js";
import { NotebookModel } from "../notebooks/notebook.model.js";
import {
  ExtractionHistoryModel,
  type ExtractionHistory,
} from "./extractionHistory.model.js";
import type { CreateExtractionHistoryInput } from "./extractionHistory.validation.js";

export async function createExtractionHistory(
  userId: string,
  input: CreateExtractionHistoryInput,
): Promise<ExtractionHistory> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(401, "Invalid authenticated user");
  }

  if (input.notebookId) {
    const notebook = await NotebookModel.findOne({
      _id: input.notebookId,
      userId,
    }).select("_id");

    if (!notebook) {
      throw new AppError(404, "Notebook not found");
    }
  }

  return ExtractionHistoryModel.create({
    ...input,
    userId,
    notebookId: input.notebookId ?? null,
  });
}

export async function listExtractionHistory(
  userId: string,
  page = 1,
  limit = 20,
) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  const filter = { userId };

  const [items, total] = await Promise.all([
    ExtractionHistoryModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),

    ExtractionHistoryModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

export async function getExtractionHistoryById(
  userId: string,
  extractionId: string,
) {
  if (!Types.ObjectId.isValid(extractionId)) {
    throw new AppError(404, "Extraction history not found");
  }

  const extraction = await ExtractionHistoryModel.findOne({
    _id: extractionId,
    userId,
  }).lean();

  if (!extraction) {
    throw new AppError(404, "Extraction history not found");
  }

  return extraction;
}

export async function deleteExtractionHistory(
  userId: string,
  extractionId: string,
): Promise<void> {
  if (!Types.ObjectId.isValid(extractionId)) {
    throw new AppError(404, "Extraction history not found");
  }

  const result = await ExtractionHistoryModel.deleteOne({
    _id: extractionId,
    userId,
  });

  if (result.deletedCount === 0) {
    throw new AppError(404, "Extraction history not found");
  }
}
