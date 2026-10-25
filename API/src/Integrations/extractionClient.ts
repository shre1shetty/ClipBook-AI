import axios from "axios";
import { env } from "../config/env.js";
import FormData from "form-data";

const extractionServiceUrl = env.EXTRACTION_SERVICE_URL;

const extractionClient = axios.create({
  baseURL: extractionServiceUrl,
  timeout: 120_000,
});

interface ExtractionResult {
  content: string;
  source: "URL" | "Image";
}

interface ExtractionServiceResponse {
  success: boolean;
  result: ExtractionResult;
}

export async function extractFromUrl(url: string): Promise<ExtractionResult> {
  const response = await extractionClient.post<ExtractionServiceResponse>(
    `/extraction/url`,
    { url },
  );
  if (!response.data.success || !response.data.result?.content) {
    throw new Error("ExtractionService returned an invalid response");
  }

  return response.data.result;
}

export async function extractFromImage(
  file: Express.Multer.File,
): Promise<ExtractionResult> {
  const form = new FormData();

  form.append("image", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const response = await extractionClient.post<ExtractionServiceResponse>(
    "/extraction/image",
    form,
    {
      headers: form.getHeaders(),
      maxBodyLength: 10 * 1024 * 1024,
    },
  );

  if (!response.data.success || !response.data.result?.content) {
    throw new Error("ExtractionService returned an invalid response");
  }

  return response.data.result;
}
