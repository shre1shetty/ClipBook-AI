import type { Request } from "express";
import { AuthenticatedRequest } from "../middleware/authenticate.js";
import { AppError } from "../shared/errors/AppError.js";

export function parsePositiveInteger(value: unknown, fallback: number): number {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new AppError(400, "Pagination values must be positive integers");
  }

  return parsed;
}

export function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).user.id;
}
