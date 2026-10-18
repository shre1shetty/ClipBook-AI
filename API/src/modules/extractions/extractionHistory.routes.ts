import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  getExtractionHistory,
  getExtractionHistoryItem,
  removeExtractionHistory,
} from "./extractionHistory.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getExtractionHistory);
router.get("/:extractionId", getExtractionHistoryItem);
router.delete("/:extractionId", removeExtractionHistory);

export default router;
