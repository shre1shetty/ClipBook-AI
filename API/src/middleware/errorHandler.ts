import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/AppError.js";
import { env } from "../config/env.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  console.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(env.NODE_ENV === "development" && error instanceof Error
      ? { detail: error.message }
      : {}),
  });
};
