export interface ExtractionResult {
  content: string;
  title?: string | undefined;
  source: "Image" | "URL";
}
