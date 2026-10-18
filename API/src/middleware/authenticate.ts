import type { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/AppError.js";
import { veirifyAccessToken } from "../modules/auth/auth.utils.js";

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const token = req.cookies?.accessToken;
    if (typeof token !== "string" || !token) {
      throw new AppError(401, "Authentication required");
    }
    const payload = veirifyAccessToken(token);
    (req as AuthenticatedRequest).user = {
      id: payload.sub, //userid
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError(401, "Invalid or expired access token"));
  }
}
