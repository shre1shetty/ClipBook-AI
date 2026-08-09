import type { ExtractionResult } from "../../interfaces/ExtractionResult.js";

export interface OCRProvider {
  extract(image: Buffer): Promise<ExtractionResult>;
}
