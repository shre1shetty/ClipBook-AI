import { Router } from "express";
import { upload } from "../config/multer.js";
import { extractText } from "../controllers/extraction.controller.js";

const router: Router = Router();
router.post("/extract", upload.single("image"), extractText);
export const extractionRouter: Router = router;
