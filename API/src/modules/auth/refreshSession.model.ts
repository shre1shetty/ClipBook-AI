import { Schema, model, type InferSchemaType } from "mongoose";

const refreshSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedByTokenHash: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Automatically remove expired sessions from MongoDB.
// Authentication must still explicitly check expiresAt.
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshSession = InferSchemaType<typeof refreshSessionSchema>;

export const RefreshSessionModel = model(
  "RefreshSession",
  refreshSessionSchema,
);
