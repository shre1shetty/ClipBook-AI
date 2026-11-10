import { validateUserId } from "../../util/util.js";
import { ExtractionHistoryModel } from "../extractions/extractionHistory.model.js";
import { NotebookModel } from "../notebooks/notebook.model.js";

const RESULTS_PER_TYPE = 8;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchAll(userId: string, query: string) {
  validateUserId(userId);
  const pattern = new RegExp(escapeRegex(query), "i");

  const [notebooks, extractions] = await Promise.all([
    NotebookModel.find({
      userId,
      $or: [{ title: pattern }, { content: pattern }],
    })
      .select("title updatedAt")
      .sort({ updatedAt: -1 })
      .limit(RESULTS_PER_TYPE)
      .lean(),
    ExtractionHistoryModel.find({
      userId,
      $or: [{ title: pattern }, { extractedContent: pattern }],
    })
      .select("title sourceType sourceUrl sourceImage notebookId createdAt")
      .sort({ createdAt: -1 })
      .limit(RESULTS_PER_TYPE)
      .lean(),
  ]);

  return { notebooks, extractions };
}
