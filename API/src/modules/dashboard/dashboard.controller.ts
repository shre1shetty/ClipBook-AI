import type { Request, Response, NextFunction } from "express";
import { getUserId, parsePositiveInteger } from "../../util/util.js";
import { getActivity, getDashboard } from "./dashboard.service.js";

export async function getDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dashboard = await getDashboard(getUserId(req));
    res.status(200).json({ success: true, ...dashboard });
  } catch (error) {
    next(error);
  }
}

export async function getActivityHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const limit = parsePositiveInteger(req.query.limit, 10);
    const activity = await getActivity(getUserId(req), limit);
    res.status(200).json({ success: true, activity });
  } catch (error) {
    next(error);
  }
}
