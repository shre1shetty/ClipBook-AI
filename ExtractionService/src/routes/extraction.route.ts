import { Router } from "express";
import { upload } from "../config/multer.js";
import {
  extractText,
  extractTextFromUrl,
} from "../controllers/extraction.controller.js";

const router: Router = Router();
router.post("/image", upload.single("image"), extractText);
router.post("/url", extractTextFromUrl);
export const extractionRouter: Router = router;
