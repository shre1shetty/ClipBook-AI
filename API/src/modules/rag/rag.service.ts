import { Types } from "mongoose";
import { AppError } from "../../shared/errors/AppError.js";
import { NotebookModel } from "../notebooks/notebook.model.js";
import { queryNotebook } from "./rag.client.js";
import type { QueryNotebookInput } from "./rag.validation.js";

export async function askNotebook(
  userId: string,
  notebookId: string,
  input: QueryNotebookInput,
) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError(401, "Invalid authenticated user");
  }
  if (!Types.ObjectId.isValid(notebookId)) {
    throw new AppError(404, "Notebook not found");
  }

  // Ownership check: the RagService trusts whatever notebook_id it receives.
  const notebook = await NotebookModel.findOne({ _id: notebookId, userId })
    .select("ragSyncStatus ragSyncedVersion contentVersion")
    .lean();

  if (!notebook) {
    throw new AppError(404, "Notebook not found");
  }

  // Never indexed: nothing to search yet.
  if (notebook.ragSyncedVersion === 0) {
    throw new AppError(
      409,
      notebook.ragSyncStatus === "failed"
        ? "Indexing this notebook failed. Edit it to try again."
        : "This notebook is still being indexed. Try again shortly.",
    );
  }

  try {
    const answer = await queryNotebook({
      notebookId,
      query: input.query,
      topK: 5,
    });

    return {
      answer,
      // false means the answer is based on an earlier version of the notebook
      index: {
        status: notebook.ragSyncStatus,
        upToDate: notebook.ragSyncedVersion === notebook.contentVersion,
      },
    };
  } catch (error) {
    console.error("RAG query failed:", error);
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new AppError(
      timedOut ? 504 : 502,
      "The answer service is unavailable. Please try again.",
    );
  }
}
