import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  getActivityHandler,
  getDashboardHandler,
} from "./dashboard.controller.js";

const dashboardRouter = Router();
//since dashboard endpoint is directly from /api so we will not user
// authenticate in router.use , since it can throw error for invalid
// user for wrong endpoints too and will never reach notFound handler
dashboardRouter.get("/dashboard", authenticate, getDashboardHandler);
dashboardRouter.get("/activity", authenticate, getActivityHandler);

export default dashboardRouter;
