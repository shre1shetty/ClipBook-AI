import { NotebookModel } from "../notebooks/notebook.model.js";
import { enqueueIngestion, ingestJobId, ragQueue } from "./rag.queue.js";

export async function sweepUnsyncedNotebooks(): Promise<number> {
  const stale = await NotebookModel.find({
    $expr: { $lt: ["$ragSyncedVersion", "$contentVersion"] },
  })
    .select("_id contentVersion")
    .lean();

  for (const notebook of stale) {
    const notebookId = String(notebook._id);

    // BullMQ ignores add() while a job with the same id exists, even a finished one.
    // A stale notebook with a completed/failed job of this version needs a fresh job.
    const previous = await ragQueue.getJob(
      ingestJobId(notebookId, notebook.contentVersion),
    );
    if (
      previous &&
      ((await previous.isCompleted()) || (await previous.isFailed()))
    ) {
      await previous.remove();
    }

    await enqueueIngestion(notebookId, notebook.contentVersion);
  }
  return stale.length;
}
