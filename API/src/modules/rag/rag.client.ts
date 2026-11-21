import { env } from "../../config/env.js";

// The free-tier RagService sleeps when idle. While it wakes up and loads its models,
// Render's proxy answers 502/503/504, so those mean "not ready yet", not "failed".
const COLD_START_STATUSES = new Set([502, 503, 504]);
const WAKE_TIMEOUT_MS = 150_000;
const WAKE_POLL_MS = 3_000;

function send(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${env.RAG_SERVICE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": env.RAG_INTERNAL_KEY,
    },
    signal: AbortSignal.timeout(env.RAG_TIMEOUT_MS),
  });
}

async function waitUntilAwake(): Promise<void> {
  const deadline = Date.now() + WAKE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${env.RAG_SERVICE_URL}/`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return;
    } catch {
      // still starting up
    }
    await new Promise((resolve) => setTimeout(resolve, WAKE_POLL_MS));
  }
  throw new Error("RagService did not wake up in time");
}

async function ragRequest<T>(
  path: string,
  init: RequestInit,
): Promise<T | undefined> {
  let response: Response;
  try {
    response = await send(path, init);
  } catch (error) {
    // A real timeout means the request itself was slow, so don't resend it.
    if (error instanceof Error && error.name === "TimeoutError") throw error;
    await waitUntilAwake(); // connection refused or reset while the service boots
    response = await send(path, init);
  }

  if (COLD_START_STATUSES.has(response.status)) {
    await waitUntilAwake();
    response = await send(path, init);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `RagService ${init.method} ${path} failed: ${response.status} ${detail.slice(0, 200)}`,
    );
  }

  return response.status === 204 ? undefined : ((await response.json()) as T);
}

export function ingestNotebook(input: {
  notebookId: string;
  title: string;
  content: string;
}): Promise<void> {
  return ragRequest("/api/documents/ingest", {
    method: "POST",
    body: JSON.stringify({
      notebook_id: input.notebookId,
      title: input.title,
      content: input.content,
      metadata: {},
    }),
  });
}

export function deleteNotebookVectors(notebookId: string): Promise<void> {
  return ragRequest(`/api/documents/${encodeURIComponent(notebookId)}`, {
    method: "DELETE",
  });
}

type QueryResponse = {
  answer: string;
  sources: {
    chunk_id: string;
    heading_path: string[];
    page_number: number | null;
    similarity_score: number;
    rerank_score: number;
  }[];
};

export async function queryNotebook(input: {
  notebookId: string;
  query: string;
  topK: number;
}) {
  const data = await ragRequest<QueryResponse>("/api/rag/query", {
    method: "POST",
    body: JSON.stringify({
      query: input.query,
      notebook_id: input.notebookId,
      top_k: input.topK,
    }),
  });

  return data?.answer;
}

type TextChatResponse = {
  answer: string;
};

export async function chatText(input: {
  text: string;
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
}) {
  const data = await ragRequest<TextChatResponse>("/api/rag/chat-text", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return data?.answer;
}
