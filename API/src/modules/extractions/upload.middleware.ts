import { AppError } from "../../shared/errors/AppError.js";
import multer from "multer";
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new AppError(400, "Unsupported image type. Use JPEG, PNG, or WebP."),
      );
      return;
    }

    callback(null, true);
  },
}).single("image");
