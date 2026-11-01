import { Queue } from "bullmq";
import { redis } from "./rag.connection.js";

export const INGESTION_QUEUE = "rag-ingestion";

export type RagJobData =
  | { type: "ingest"; notebookId: string; version: number }
  | { type: "delete"; notebookId: string };

export const ragQueue = new Queue<RagJobData>(INGESTION_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

export async function enqueueIngestion(
  notebookId: string,
  version: number,
): Promise<void> {
  try {
    await ragQueue.add(
      "ingest",
      { type: "ingest", notebookId, version },
      { jobId: `ingest_${notebookId}_v${version}` },
    );
  } catch (error) {
    console.error("Failed to enqueue ingestion (sweeper will retry):", error);
  }
}

export async function enqueueDeletion(notebookId: string): Promise<void> {
  try {
    await ragQueue.add(
      "delete",
      { type: "delete", notebookId },
      { jobId: `delete_${notebookId}` },
    );
  } catch (error) {
    console.error("Failed to enqueue vector deletion:", error);
  }
}
