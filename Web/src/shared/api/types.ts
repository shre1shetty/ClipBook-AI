export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Notebook {
  _id: string;
  title: string;
  content?: string;
  createdAt: string;
  updatedAt: string;
  extractionCount?: number;
  ragSyncStatus?: "pending" | "synced" | "failed";
}

export interface Extraction {
  _id: string;
  title: string | null;
  sourceType: "URL" | "IMAGE";
  sourceUrl: string | null;
  sourceImage: string | null;
  extractedContent?: string;
  notebookId?: string | { _id: string; title: string } | null;
  createdAt: string;
  status: "pending" | "completed" | "failed";
}

export interface Activity {
  type: "notebook_created" | "notebook_updated" | "extraction_created";
  at: string;
  notebook: { id: string; title: string } | null;
  extraction?: {
    id: string;
    title: string | null;
    sourceType: "URL" | "IMAGE";
  };
}
