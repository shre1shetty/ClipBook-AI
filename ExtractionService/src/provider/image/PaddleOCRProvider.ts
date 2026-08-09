import axios from "axios";
import type { ExtractionResult } from "../../interfaces/ExtractionResult.js";
import type { OCRProvider } from "./OCRProvider.js";
import { paddleOCRClient } from "./PaddleOCRClient.js";
import { Model } from "@paddleocr/api-sdk";
interface PaddleOCRResult {
  rec_texts?: string[];
}

export class PaddleOCRProvider implements OCRProvider {
  private readonly apiKey: string = process.env.PADDLEOCR_ACCESS_TOKEN || "";
  async extract(image: Buffer): Promise<ExtractionResult> {
    const result = await paddleOCRClient.ocr({
      filePath: "",
      model: Model.PPOCRv5,
    });
    const content = result.pages
      .flatMap((page) => {
        const ocrResult = page.prunedResult as PaddleOCRResult;
        return ocrResult.rec_texts || [];
      })
      .join("\n");
    return {
      content: content,
      source: "Image",
    };
  }
}
