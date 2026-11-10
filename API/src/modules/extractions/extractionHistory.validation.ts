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

    title: z.string().trim().max(200).nullable().optional(),

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

export const chatExtractionSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4_000, "Message is too long"),
  history: z
    .array(
      z.strictObject({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4_000),
      }),
    )
    .max(20)
    .default([]),
  text: z.string().min(1).max(60_000).optional(),
});

export type ChatExtractionInput = z.infer<typeof chatExtractionSchema>;

export const listExtractionsQuerySchema = z
  .object({
    notebookId: objectIdSchema.optional(),
    unassigned: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    sourceType: z.enum(["URL", "IMAGE"]).optional(),
  })
  .refine((data) => !(data.notebookId && data.unassigned), {
    message: "notebookId and unassigned cannot be used together",
  });

export type ListExtractionsFilters = z.infer<typeof listExtractionsQuerySchema>;

export const updateExtractionSchema = z
  .strictObject({
    title: z
      .string()
      .trim()
      .min(1, "Title cannot be empty")
      .max(200, "Title is too long")
      .optional(),
    extractedContent: z
      .string()
      .min(1, "Extracted content cannot be empty")
      .max(1_000_000, "Extracted content is too large")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update",
  });

export type UpdateExtractionInput = z.infer<typeof updateExtractionSchema>;
