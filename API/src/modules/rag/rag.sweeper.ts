import { NotebookModel } from "../notebooks/notebook.model.js";
import { enqueueIngestion } from "./rag.queue.js";

export async function sweepUnsyncedNotebooks(): Promise<number> {
  const stale = await NotebookModel.find({
    $expr: { $lt: ["$ragSyncedVersion", "$contentVersion"] },
  })
    .select("_id contentVersion")
    .lean();

  for (const notebook of stale) {
    await enqueueIngestion(String(notebook._id), notebook.contentVersion);
  }
  return stale.length;
}
