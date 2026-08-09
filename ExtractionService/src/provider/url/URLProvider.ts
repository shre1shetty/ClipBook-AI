import type { ExtractionResult } from "../../interfaces/ExtractionResult.js";

export interface URLProvider {
  extract(url: string): Promise<ExtractionResult>;
}
