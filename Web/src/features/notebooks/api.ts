import type { ApiClient, ApiReader } from "@/shared/api/reader";
import type { Extraction, Notebook } from "@/shared/api/types";

export interface NotebookListData {
  notebooks: Notebook[];
}

export interface NotebookData {
  notebook: Notebook;
}

export interface NotebookExtractionsData {
  items: Extraction[];
}

export interface NotebookQuestionResult {
  answer: string;
  index: {
    status: "pending" | "synced" | "failed";
    upToDate: boolean;
  };
}

export interface NotebookQuestionData {
  answer: NotebookQuestionResult;
}

export function getNotebooks(reader: ApiReader) {
  return reader.get<NotebookListData>("/notebooks");
}

export function getNotebook(reader: ApiReader, notebookId: string) {
  return reader.get<NotebookData>(`/notebooks/${encodeURIComponent(notebookId)}`);
}

export function getNotebookExtractions(reader: ApiReader, notebookId: string) {
  return reader.get<NotebookExtractionsData>(
    `/extractions?notebookId=${encodeURIComponent(notebookId)}`,
  );
}

export function createNotebook(client: ApiClient, title: string) {
  return client.post<NotebookData>("/notebooks/create", { title });
}

export function updateNotebook(
  client: ApiClient,
  notebookId: string,
  input: { title?: string; content?: string; extractionIds?: string[] },
) {
  return client.post<NotebookData>(
    `/notebooks/update/${encodeURIComponent(notebookId)}`,
    input,
  );
}

export function deleteNotebook(client: ApiClient, notebookId: string) {
  return client.delete<void>(`/notebooks/${encodeURIComponent(notebookId)}`);
}

export function askNotebook(
  client: ApiClient,
  notebookId: string,
  query: string,
) {
  return client.post<NotebookQuestionData>(
    `/notebooks/query/${encodeURIComponent(notebookId)}`,
    { query },
  );
}
