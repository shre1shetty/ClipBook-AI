import { AppError } from "../../shared/errors/AppError.js";
import { chatText } from "../rag/rag.client.js";
import { ExtractionChatModel } from "./extractionChat.model.js";
import { getExtractionHistoryById } from "./extractionHistory.service.js";
import { ChatExtractionInput } from "./extractionHistory.validation.js";

const MAX_TEXT_CHARS = 60_000;
const MAX_HISTORY_EXCHANGES = 10;

export async function getExtractionChatHistory(
  userId: string,
  extractionId: string,
) {
  const extraction = await getExtractionHistoryById(userId, extractionId);
  const exchanges = await ExtractionChatModel.find({
    userId,
    extractionId: extraction._id,
  })
    .select("question answer createdAt")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  return {
    messages: exchanges.flatMap((exchange) => {
      const id = String(exchange._id);
      const createdAt = exchange.createdAt.toISOString();
      return [
        {
          id: `${id}-user`,
          role: "user" as const,
          content: exchange.question,
          createdAt,
        },
        {
          id: `${id}-assistant`,
          role: "assistant" as const,
          content: exchange.answer,
          createdAt,
        },
      ];
    }),
  };
}

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
  const previousExchanges = await ExtractionChatModel.find({
    userId,
    extractionId: extraction._id,
  })
    .select("question answer")
    .sort({ createdAt: -1, _id: -1 })
    .limit(MAX_HISTORY_EXCHANGES)
    .lean();
  const history: Array<{ role: "user" | "assistant"; content: string }> =
    previousExchanges.reverse().flatMap((exchange) => [
      { role: "user", content: exchange.question },
      { role: "assistant", content: exchange.answer },
    ]);

  let answer: string | undefined;
  try {
    answer = await chatText({
      text: truncated ? source.slice(0, MAX_TEXT_CHARS) : source,
      history,
      message: input.message,
    });
  } catch (error) {
    console.error("Extraction chat failed:", error);
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new AppError(
      timedOut ? 504 : 502,
      "The answer service is unavailable. Please try again.",
    );
  }

  if (!answer?.trim()) {
    throw new AppError(502, "The answer service returned an empty response.");
  }

  await ExtractionChatModel.create({
    userId,
    extractionId: extraction._id,
    question: input.message,
    answer,
  });

  return { answer, truncated };
}
