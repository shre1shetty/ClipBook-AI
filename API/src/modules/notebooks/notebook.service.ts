import { Types } from "mongoose";
import {
  CreateNotebookInput,
  UpdateNotebookInput,
} from "./notebook.validation.js";
import { AppError } from "../../shared/errors/AppError.js";
import { Notebook, NotebookModel } from "./notebook.model.js";
import { enqueueDeletion, enqueueIngestion } from "../rag/rag.queue.js";
import { ExtractionHistoryModel } from "../extractions/extractionHistory.model.js";

function validateUserId(userId: string): void {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(401, "Invalid authenticated user");
  }
}

async function linkExtractions(
  userId: string,
  notebookId: string,
  extractionIds: string[],
): Promise<void> {
  await ExtractionHistoryModel.updateMany(
    {
      _id: { $in: extractionIds },
      userId,
    },
    {
      $set: { notebookId },
    },
  );
}

export async function createNotebook(
  userId: string,
  input: CreateNotebookInput,
): Promise<Notebook> {
  validateUserId(userId);
  const notebook = await NotebookModel.create({
    userId,
    title: input.title,
    content: input.content,
    contentVersion: 1,
    ragSyncStatus: "pending",
    ragSyncedVersion: 0,
  });
  if (input.extractionIds && input.extractionIds.length > 0)
    await linkExtractions(userId, String(notebook._id), input.extractionIds);
  await enqueueIngestion(String(notebook._id), notebook.contentVersion);
  return notebook;
}

export async function listNotebooks(userId: string): Promise<Notebook[]> {
  validateUserId(userId);

  return NotebookModel.find({ userId }).sort({ updatedAt: -1 }).lean();
}

export async function getNotebookById(
  userId: string,
  notebookId: string,
): Promise<Notebook> {
  validateUserId(userId);

  if (!Types.ObjectId.isValid(notebookId)) {
    throw new AppError(404, "Notebook not found");
  }

  const notebook = await NotebookModel.findOne({
    _id: notebookId,
    userId,
  }).lean();

  if (!notebook) {
    throw new AppError(404, "Notebook not found");
  }

  return notebook;
}

export async function updateNotebook(
  userId: string,
  notebookId: string,
  input: UpdateNotebookInput,
): Promise<Notebook> {
  validateUserId(userId);

  if (!Types.ObjectId.isValid(notebookId)) {
    throw new AppError(404, "Notebook not found");
  }

  const existing = await NotebookModel.findOne({ _id: notebookId, userId })
    .select("content")
    .lean();

  if (!existing) {
    throw new AppError(404, "Notebook not found");
  }

  const contentChanged =
    input.content !== undefined && input.content !== existing.content;

  const updates: Record<string, unknown> = {};

  updates.title = input.title;
  updates.content = input.content;
  if (contentChanged) updates.ragSyncStatus = "pending";
  if (contentChanged) updates.$inc = { contentVersion: 1 };

  const notebook = await NotebookModel.findOneAndUpdate(
    { _id: notebookId, userId },
    updates,
    { new: true, runValidators: true },
  );

  if (!notebook) {
    throw new AppError(404, "Notebook not found");
  }

  if (contentChanged) {
    if (input.extractionIds && input.extractionIds.length > 0)
      await linkExtractions(userId, String(notebook._id), input.extractionIds);
    await enqueueIngestion(String(notebook._id), notebook.contentVersion);
  }

  return notebook;
}

export async function deleteNotebook(
  userId: string,
  notebookId: string,
): Promise<void> {
  validateUserId(userId);

  if (!Types.ObjectId.isValid(notebookId)) {
    throw new AppError(404, "Notebook not found");
  }

  const result = await NotebookModel.deleteOne({
    _id: notebookId,
    userId,
  });

  if (result.deletedCount === 0) {
    throw new AppError(404, "Notebook not found");
  }
  await ExtractionHistoryModel.updateMany(
    { notebookId, userId },
    { $set: { notebookId: null } },
  );
  await enqueueDeletion(notebookId);
}
