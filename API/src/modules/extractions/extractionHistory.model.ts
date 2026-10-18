import { Schema, model, type InferSchemaType } from "mongoose";

const extractionHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Null until the user adds this extraction to a notebook.
    notebookId: {
      type: Schema.Types.ObjectId,
      ref: "Notebook",
      default: null,
      index: true,
    },

    sourceType: {
      type: String,
      enum: ["URL", "IMAGE"],
      required: true,
    },

    sourceUrl: {
      type: String,
      trim: true,
      default: null,
    },
    sourceImage: {
      type: String,
      trim: true,
      default: null,
    },
    extractedContent: {
      type: String,
      required: true,
      maxlength: 1_000_000,
    },

    summary: {
      type: String,
      default: null,
      maxlength: 100_000,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      required: true,
    },

    error: {
      type: String,
      default: null,
      maxlength: 2_000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

extractionHistorySchema.index({
  userId: 1,
  createdAt: -1,
});

export type ExtractionHistory = InferSchemaType<typeof extractionHistorySchema>;

export const ExtractionHistoryModel = model(
  "ExtractionHistory",
  extractionHistorySchema,
);
