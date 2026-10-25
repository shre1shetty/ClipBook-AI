import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  extractImage,
  extractUrl,
  getExtractionHistory,
  getExtractionHistoryItem,
  removeExtractionHistory,
} from "./extractionHistory.controller.js";
import { uploadImage } from "./upload.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getExtractionHistory);
router.post("/url", extractUrl);
router.post("/image", uploadImage, extractImage);
router.get("/:extractionId", getExtractionHistoryItem);
router.delete("/:extractionId", removeExtractionHistory);

export default router;
