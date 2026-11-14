import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import {
  chatExtraction,
  extractImage,
  extractUrl,
  getExtractionChat,
  getExtractionHistory,
  getExtractionHistoryItem,
  removeExtractionHistory,
  updateExtraction,
} from "./extractionHistory.controller.js";
import { uploadImage } from "./upload.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", getExtractionHistory);
router.post("/url", extractUrl);
router.post("/image", uploadImage, extractImage);
router.get("/:extractionId/chat", getExtractionChat);
router.get("/:extractionId", getExtractionHistoryItem);
router.patch("/:extractionId", updateExtraction);
router.post("/:extractionId/chat", chatExtraction);
router.delete("/:extractionId", removeExtractionHistory);

export default router;
