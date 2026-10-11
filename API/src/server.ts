import app from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/database.js";

async function bootstrap(): Promise<void> {
  await connectDB();

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
        await disconnectDB();
      } catch (disconnectError) {
        console.error("MongoDB disconnect failed:", disconnectError);
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
