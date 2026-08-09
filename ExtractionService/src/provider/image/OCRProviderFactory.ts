import type { OCRProvider } from "./OCRProvider.js";
import { OCRSpaceProvider } from "./OCRSpaceProvider.js";
import { PaddleOCRProvider } from "./PaddleOCRProvider.js";

export class OCRProviderFactory {
  static getProvider(): OCRProvider {
    switch (process.env.OCR_PROVIDER) {
      case "OCRSEARCH":
        return new OCRSpaceProvider();

      case "PADDLEOCR":
        return new PaddleOCRProvider();

      default:
        return new OCRSpaceProvider();
    }
  }
}
