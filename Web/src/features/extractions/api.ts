import type { ApiClient, ApiReader } from "@/shared/api/reader";
import type { Extraction } from "@/shared/api/types";

export interface ExtractionListData {
  items: Extraction[];
  pagination?: { total: number };
}

export interface ExtractionData {
  extraction: Extraction;
}

export interface ExtractionChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ExtractionChatHistoryData {
  messages: ExtractionChatMessage[];
}

export function getExtractions(
  reader: ApiReader,
  options: { filter?: string; notebookId?: string; limit?: number } = {},
) {
  const params = new URLSearchParams({
    limit: String(options.limit ?? 50),
  });
  if (options.filter === "unassigned") params.set("unassigned", "true");
  if (options.filter === "URL" || options.filter === "IMAGE") {
    params.set("sourceType", options.filter);
  }
  if (options.notebookId) params.set("notebookId", options.notebookId);

  return reader.get<ExtractionListData>(`/extractions?${params.toString()}`);
}

export function getExtraction(reader: ApiReader, extractionId: string) {
  return reader.get<ExtractionData>(
    `/extractions/${encodeURIComponent(extractionId)}`,
  );
}

export function getExtractionChat(
  reader: ApiReader,
  extractionId: string,
) {
  return reader.get<ExtractionChatHistoryData>(
    `/extractions/${encodeURIComponent(extractionId)}/chat`,
  );
}

export function extractUrl(client: ApiClient, url: string) {
  return client.post<ExtractionData>("/extractions/url", { url });
}

export function extractImage(client: ApiClient, file: File) {
  return client.upload<ExtractionData>("/extractions/image", file);
}

export function deleteExtraction(client: ApiClient, extractionId: string) {
  return client.delete<void>(
    `/extractions/${encodeURIComponent(extractionId)}`,
  );
}

export function chatWithExtraction(
  client: ApiClient,
  extractionId: string,
  input: { message: string },
) {
  return client.post<{ answer: string }>(
    `/extractions/${encodeURIComponent(extractionId)}/chat`,
    input,
  );
}
