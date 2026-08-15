import type { RequestHandler } from "express";

export const asyncHandler = (handler: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    try {
      const result = handler(req, res, next);
      Promise.resolve(result).catch(next);
    } catch (err) {
      next(err);
    }
  };
};
