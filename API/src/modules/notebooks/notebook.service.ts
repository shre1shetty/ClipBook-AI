import { Types } from "mongoose";
import {
  CreateNotebookInput,
  UpdateNotebookInput,
} from "./notebook.validation.js";
import { AppError } from "../../shared/errors/AppError.js";
import { Notebook, NotebookModel } from "./notebook.model.js";

function validateUserId(userId: string): void {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(401, "Invalid authenticated user");
  }
}

export async function createNotebook(
  userId: string,
  input: CreateNotebookInput,
): Promise<Notebook> {
  validateUserId(userId);
  return NotebookModel.create({
    userId,
    title: input.title,
    content: input.content,
    contentVersion: 1,
    ragSyncStatus: "pending",
    ragSyncedVersion: 0,
  });
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

  const updates: Record<string, unknown> = {};

  updates.title = input.title;
  updates.content = input.content;
  updates.$inc = { contentVersion: 1 };
  updates.ragSyncStatus = "pending";

  const notebook = await NotebookModel.findOneAndUpdate(
    { _id: notebookId, userId },
    updates,
    { new: true, runValidators: true },
  );

  if (!notebook) {
    throw new AppError(404, "Notebook not found");
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
}
