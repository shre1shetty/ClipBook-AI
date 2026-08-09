import { OCRProviderFactory } from "../provider/image/OCRProviderFactory.js";
import type { OCRProvider } from "../provider/image/OCRProvider.js";
import type { ExtractionResult } from "../interfaces/ExtractionResult.js";

export class ExtractionService {
  private readonly ocrProvider: OCRProvider;

  constructor() {
    this.ocrProvider = OCRProviderFactory.getProvider();
  }

  async extractText(image: Buffer): Promise<ExtractionResult> {
    return this.ocrProvider.extract(image);
  }
}
