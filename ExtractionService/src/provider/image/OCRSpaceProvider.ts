import axios from "axios";
import type { ExtractionResult } from "../../interfaces/ExtractionResult.js";
import type { OCRProvider } from "./OCRProvider.js";
import type { OCRSpaceResponse } from "../../interfaces/OCRSpaceResponse.js";
import FormData from "form-data";

export class OCRSpaceProvider implements OCRProvider {
  private readonly apiKey: string = process.env.OCRSEARCH_KEY || "";
  async extract(image: Buffer): Promise<ExtractionResult> {
    const formData = new FormData();
    formData.append("file", image, {
      filename: "image.png",
      contentType: "image/png",
    });
    formData.append("language", "eng");
    formData.append("OCREngine", "2");
    const result = await axios.post<OCRSpaceResponse>(
      "https://api.ocr.space/parse/image",
      formData,
      {
        headers: {
          apikey: this.apiKey,
        },
      },
    );
    const parsedText = result.data.ParsedResults?.[0]?.ParsedText || "";
    return {
      content: parsedText,
      source: "Image",
    };
  }
}
