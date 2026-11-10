import { Worker, type Job } from "bullmq";
import { NotebookModel } from "../notebooks/notebook.model.js";
import { deleteNotebookVectors, ingestNotebook } from "./rag.client.js";
import { INGESTION_QUEUE, type RagJobData } from "./rag.queue.js";
import { redis } from "./rag.connection.js";

async function processJob(job: Job<RagJobData>): Promise<void> {
  if (job.data.type === "delete") {
    await deleteNotebookVectors(job.data.notebookId);
    return;
  }

  const { notebookId } = job.data;
  const notebook = await NotebookModel.findById(notebookId).lean();
  if (!notebook) return; // deleted since the job was queued

  const version = notebook.contentVersion;
  if (notebook.ragSyncedVersion >= version) return; // already synced

  const content = notebook.content ?? "";
  if (content.trim() === "") {
    await deleteNotebookVectors(notebookId); // content cleared: remove old vectors
  } else {
    await ingestNotebook({ notebookId, title: notebook.title, content });
  }

  // Only mark synced if the notebook was not edited while we were ingesting.
  await NotebookModel.updateOne(
    { _id: notebookId, contentVersion: version },
    {
      $set: { ragSyncStatus: "synced", ragSyncedVersion: version },
      $unset: { ragSyncError: "" },
    },
    // Background bookkeeping, not a user edit: keep updatedAt unchanged.
    { timestamps: false },
  );
}

export function startRagWorker(): Worker<RagJobData> {
  const worker = new Worker<RagJobData>(INGESTION_QUEUE, processJob, {
    connection: redis,
    concurrency: 1, // one ingest at a time
    lockDuration: 5 * 60_000, // slow ingests must not look "stalled"
    limiter: { max: 6, duration: 60_000 },
  });

  worker.on("failed", async (job, error) => {
    console.error(`RAG job ${job?.id ?? "?"} failed:`, error.message);
    if (!job || job.data.type !== "ingest") return;

    const finalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
    if (!finalAttempt) return;

    await NotebookModel.updateOne(
      {
        _id: job.data.notebookId,
        contentVersion: job.data.version,
        ragSyncedVersion: { $lt: job.data.version },
      },
      {
        $set: {
          ragSyncStatus: "failed",
          ragSyncError: error.message.slice(0, 500),
        },
      },
      // Background bookkeeping, not a user edit: keep updatedAt unchanged.
      { timestamps: false },
    ).catch((updateError) =>
      console.error("Could not mark notebook failed:", updateError),
    );
  });

  worker.on("error", (error) =>
    console.error("RAG worker error:", error.message),
  );
  return worker;
}
