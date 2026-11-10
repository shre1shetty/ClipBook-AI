import { AppError } from "../../shared/errors/AppError.js";
import { chatText } from "../rag/rag.client.js";
import { getExtractionHistoryById } from "./extractionHistory.service.js";
import { ChatExtractionInput } from "./extractionHistory.validation.js";

const MAX_TEXT_CHARS = 60_000;

export async function chatWithExtraction(
  userId: string,
  extractionId: string,
  input: ChatExtractionInput,
) {
  const extraction = await getExtractionHistoryById(userId, extractionId);

  if (extraction.status !== "completed") {
    throw new AppError(409, "The extraction is not ready yet.");
  }

  const source = input.text ?? extraction.extractedContent;
  const truncated = source.length > MAX_TEXT_CHARS;

  try {
    const answer = await chatText({
      text: truncated ? source.slice(0, MAX_TEXT_CHARS) : source,
      history: input.history,
      message: input.message,
    });

    return { answer, truncated };
  } catch (error) {
    console.error("Extraction chat failed:", error);
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new AppError(
      timedOut ? 504 : 502,
      "The answer service is unavailable. Please try again.",
    );
  }
}
