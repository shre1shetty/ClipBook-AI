import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/database.js";
import { startRagWorker } from "./modules/rag/rag.worker.js";
import { sweepUnsyncedNotebooks } from "./modules/rag/rag.sweeper.js";
import { ragQueue } from "./modules/rag/rag.queue.js";
import { redis } from "./modules/rag/rag.connection.js";

async function bootstrap(): Promise<void> {
  await connectDB();

  const worker = startRagWorker();

  sweepUnsyncedNotebooks()
    .then((count) => console.log(`RAG sweeper queued ${count} notebook(s)`))
    .catch((error) => console.error("RAG sweeper failed:", error));

  const server = app.listen(env.PORT, () => {
    console.log(`ClipBook Main API running at http://localhost:${env.PORT}`);
    console.log(`Health: http://localhost:${env.PORT}/health`);
  });

  let shuttingDown = false;

  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`${signal} received. Shutting down...`);

    server.close(async (error) => {
      try {
        await worker.close();
        await ragQueue.close();
        await redis.quit();
        await disconnectDB();
      } catch (disconnectError) {
        console.error("MongoDB disconnect failed:", disconnectError);
        console.error("Shutdown cleanup failed:", disconnectError);
        process.exitCode = 1;
      }

      if (error) {
        console.error("HTTP server shutdown failed:", error);
        process.exitCode = 1;
      }

      process.exit();
    });
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start Main API:", error);
  process.exitCode = 1;
});
