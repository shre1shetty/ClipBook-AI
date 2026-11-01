import { env } from "../../config/env.js";

async function ragRequest<T>(
  path: string,
  init: RequestInit,
): Promise<T | undefined> {
  const response = await fetch(`${env.RAG_SERVICE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Key": env.RAG_INTERNAL_KEY,
    },
    signal: AbortSignal.timeout(env.RAG_TIMEOUT_MS),
  });

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
