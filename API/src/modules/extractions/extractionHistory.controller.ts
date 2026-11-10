import type { Request, Response, NextFunction } from "express";
import {
  listExtractionHistory,
  getExtractionHistoryById,
  deleteExtractionHistory,
  createExtractionHistory,
  updateExtractionHistory,
} from "./extractionHistory.service.js";
import { getUserId, parsePositiveInteger } from "../../util/util.js";
import z from "zod";
import {
  extractFromImage,
  extractFromUrl,
} from "../../Integrations/extractionClient.js";
import { AppError } from "../../shared/errors/AppError.js";
import {
  chatExtractionSchema,
  listExtractionsQuerySchema,
  updateExtractionSchema,
} from "./extractionHistory.validation.js";
import { chatWithExtraction } from "./extractionChat.service.js";

function urlTitle(url: string, extractedTitle?: string): string {
  const title = extractedTitle?.trim();
  if (title) return title.slice(0, 200);

  const { hostname, pathname } = new URL(url);
  return `${hostname}${pathname === "/" ? "" : pathname}`.slice(0, 200);
}

function imageTitle(filename: string): string {
  return (
    filename
      .replace(/\.[^.]+$/, "")
      .trim()
      .slice(0, 200) || "Image"
  );
}

const extractUrlSchmea = z.object({
  url: z.url(),
});

export async function extractUrl(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { url } = extractUrlSchmea.parse(req.body);
    const result = await extractFromUrl(url);
    const extraction = await createExtractionHistory(getUserId(req), {
      sourceType: "URL",
      title: urlTitle(url, result.title),
      extractedContent: result.content,
      sourceUrl: url,
      status: "completed",
    });
    res.status(200).json({
      success: true,
      extraction,
    });
  } catch (error) {
    next(error);
  }
}

export async function extractImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError(400, "An image file is required");
    }

    const result = await extractFromImage(req.file);

    const extraction = await createExtractionHistory(getUserId(req), {
      sourceType: "IMAGE",
      title: imageTitle(req.file.originalname),
      sourceImage: req.file.originalname,
      extractedContent: result.content,
      status: "completed",
    });

    res.status(201).json({
      success: true,
      extraction,
    });
  } catch (error) {
    next(error);
  }
}

export async function getExtractionHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20);

    const filters = listExtractionsQuerySchema.parse(req.query);

    const result = await listExtractionHistory(
      getUserId(req),
      page,
      limit,
      filters,
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getExtractionHistoryItem(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const extraction = await getExtractionHistoryById(
      getUserId(req),
      req.params.extractionId?.toString(),
    );

    res.status(200).json({ success: true, extraction });
  } catch (error) {
    next(error);
  }
}

export async function removeExtractionHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteExtractionHistory(
      getUserId(req),
      req.params.extractionId?.toString(),
    );

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function updateExtraction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = updateExtractionSchema.parse(req.body);
    const extraction = await updateExtractionHistory(
      getUserId(req),
      req.params.extractionId?.toString(),
      input,
    );

    res.status(200).json({ success: true, extraction });
  } catch (error) {
    next(error);
  }
}

export async function chatExtraction(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = chatExtractionSchema.parse(req.body);
    const result = await chatWithExtraction(
      getUserId(req),
      req.params.extractionId?.toString(),
      input,
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}
