import type { ApiReader } from "@/shared/api/reader";
import type { Extraction, Notebook } from "@/shared/api/types";

export interface SearchResults {
  notebooks: Array<Pick<Notebook, "_id" | "title" | "updatedAt">>;
  extractions: Array<
    Pick<
      Extraction,
      "_id" | "title" | "sourceType" | "sourceUrl" | "sourceImage" | "createdAt"
    >
  >;
}

export function searchContent(reader: ApiReader, query: string) {
  return reader.get<SearchResults>(`/search?q=${encodeURIComponent(query)}`);
}
