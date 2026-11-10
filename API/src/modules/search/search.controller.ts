import type { Request, Response, NextFunction } from "express";
import z from "zod";
import { getUserId } from "../../util/util.js";
import { searchAll } from "./search.service.js";

const searchQuerySchema = z.object({
  q: z.string().trim().min(2, "Search must be at least 2 characters").max(100),
});

export async function searchHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { q } = searchQuerySchema.parse(req.query);
    const results = await searchAll(getUserId(req), q);
    res.status(200).json({ success: true, ...results });
  } catch (error) {
    next(error);
  }
}
