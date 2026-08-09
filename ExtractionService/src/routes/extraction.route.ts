import { Router } from "express";
import { upload } from "../config/multer.js";
import {
  extractText,
  extractTextFromUrl,
} from "../controllers/extraction.controller.js";

const router: Router = Router();
router.post("/extract", upload.single("image"), extractText);
router.post("/extractFromUrl", extractTextFromUrl);
export const extractionRouter: Router = router;
