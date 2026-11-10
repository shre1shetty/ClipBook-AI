import { Types } from "mongoose";
import { validateUserId } from "../../util/util.js";
import { NotebookModel } from "../notebooks/notebook.model.js";
import { ExtractionHistoryModel } from "../extractions/extractionHistory.model.js";
import { attachExtractionCounts } from "../notebooks/notebook.service.js";

const RECENT_NOTENOOKS = 3;
const RECENT_EXTRACTIONS = 3;

type PopulatedNotebook = {
  _id: Types.ObjectId;
  title: string;
} | null;

type ActivityEvent = {
  type: "notebook_created" | "notebook_updated" | "extraction_created";
  at: Date;
  notebook: { id: Types.ObjectId; title: string } | null;
  extraction?: {
    id: Types.ObjectId;
    title: string | null | undefined;
    sourceType: "URL" | "IMAGE";
  };
};

export async function getDashboard(userId: string) {
  validateUserId(userId);

  const [notebookCount, bySource, recentNotebooks, recentExtractions] =
    await Promise.all([
      NotebookModel.countDocuments({ userId }),
      ExtractionHistoryModel.aggregate([
        {
          $match: { userId },
        },
        {
          $group: { _id: "$sourceType", count: { $sum: 1 } },
        },
      ]),
      NotebookModel.find({ userId })
        .select("-content")
        .sort({ updatedAt: -1 })
        .limit(RECENT_NOTENOOKS)
        .lean(),
      ExtractionHistoryModel.find({ userId })
        .select("-extractedContent -summary")
        .sort({ createdAt: -1 })
        .limit(RECENT_EXTRACTIONS)
        .populate("notebookId", "title")
        .lean(),
    ]);

  const urlExtractions = bySource.find((i) => i._id === "URL")?.count ?? 0;
  const imageExtractions = bySource.find((i) => i._id === "IMAGE")?.count ?? 0;

  return {
    counts: {
      notebooks: notebookCount,
      extractions: urlExtractions + imageExtractions,
      urlExtractions,
      imageExtractions,
    },
    recentNotebooks: await attachExtractionCounts(userId, recentNotebooks),
    recentExtractions,
  };
}

export async function getActivity(userId: string, limit = 10) {
  validateUserId(userId);
  const safeLimit = Math.min(30, Math.max(1, Math.floor(limit)));

  const [notebooks, extractions] = await Promise.all([
    NotebookModel.find({ userId })
      .select("title createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .limit(safeLimit)
      .lean(),
    ExtractionHistoryModel.find({ userId })
      .select("title sourceType notebookId createdAt")
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .populate("notebookId", "title")
      .lean(),
  ]);

  const events: ActivityEvent[] = [
    ...notebooks.map(
      (notebook): ActivityEvent => ({
        type:
          notebook.updatedAt.getTime() === notebook.createdAt.getTime()
            ? "notebook_created"
            : "notebook_updated",
        at: notebook.updatedAt,
        notebook: { id: notebook._id, title: notebook.title },
      }),
    ),
    ...extractions.map((extraction): ActivityEvent => {
      const notebook = extraction.notebookId as unknown as PopulatedNotebook;
      return {
        type: "extraction_created",
        at: extraction.createdAt,
        notebook: notebook ? { id: notebook._id, title: notebook.title } : null,
        extraction: {
          id: extraction._id,
          title: extraction.title,
          sourceType: extraction.sourceType,
        },
      };
    }),
  ];

  return events
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, safeLimit);
}
