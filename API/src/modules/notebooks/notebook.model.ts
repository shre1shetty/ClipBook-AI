import { InferSchemaType, model, Schema } from "mongoose";

const notebookSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minLength: 1,
      maxLength: 150,
    },
    content: {
      type: String,
      default: "",
    },
    contentVersion: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    ragSyncStatus: {
      type: String,
      enum: ["pending", "synced", "failed"],
      default: "pending",
      required: true,
    },
    ragSyncedVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
notebookSchema.index({ userId: 1, updatedAt: -1 });

export type Notebook = InferSchemaType<typeof notebookSchema>;

export const NotebookModel = model("Notebook", notebookSchema);
