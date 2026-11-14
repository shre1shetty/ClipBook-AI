import { Schema, model, type InferSchemaType } from "mongoose";

const extractionChatSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    extractionId: {
      type: Schema.Types.ObjectId,
      ref: "ExtractionHistory",
      required: true,
    },
    question: {
      type: String,
      required: true,
      maxlength: 4_000,
    },
    answer: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

extractionChatSchema.index({ userId: 1, extractionId: 1, createdAt: 1 });

export type ExtractionChat = InferSchemaType<typeof extractionChatSchema>;

export const ExtractionChatModel = model(
  "ExtractionChat",
  extractionChatSchema,
);
