import { OCRProviderFactory } from "../provider/image/OCRProviderFactory.js";
import type { OCRProvider } from "../provider/image/OCRProvider.js";
import type { ExtractionResult } from "../interfaces/ExtractionResult.js";
import type { URLProvider } from "../provider/url/URLProvider.js";
import { URLProviderFactory } from "../provider/url/URLProviderFactory.js";

export class ExtractionService {
  private readonly ocrProvider: OCRProvider;
  private readonly urlProvider: URLProvider;

  constructor() {
    this.ocrProvider = OCRProviderFactory.getProvider();
    this.urlProvider = URLProviderFactory.getURLProvider();
  }

  async extractText(image: Buffer): Promise<ExtractionResult> {
    return this.ocrProvider.extract(image);
  }
  async extractTextFromUrl(url: string): Promise<ExtractionResult> {
    return this.urlProvider.extract(url);
  }
}
