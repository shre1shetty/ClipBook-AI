import { z } from "zod";
import { Types } from "mongoose";

const objectIdSchema = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), {
    message: "Invalid ID format",
  });

export const createExtractionHistorySchema = z
  .object({
    notebookId: objectIdSchema.nullable().optional(),

    sourceType: z.enum(["URL", "IMAGE"]),

    sourceUrl: z.string().trim().url().nullable().optional(),

    sourceImage: z.string().trim().min(1).nullable().optional(),

    extractedContent: z
      .string()
      .max(1_000_000, "Extracted content is too large"),

    status: z.enum(["pending", "completed", "failed"]).optional(),

    error: z.string().max(2_000).nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.sourceType === "URL" && !data.sourceUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceUrl"],
        message: "sourceUrl is required for URL extractions",
      });
    }

    if (data.sourceType === "IMAGE" && !data.sourceImage) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceImage"],
        message: "sourceImage is required for image extractions",
      });
    }
  });

export type CreateExtractionHistoryInput = z.infer<
  typeof createExtractionHistorySchema
>;
