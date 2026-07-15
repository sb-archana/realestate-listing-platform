import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const uploadPropertyImages = multer({
  storage,
  limits: {
    fileSize: env.MAX_IMAGE_SIZE_MB * 1024 * 1024,
    files: env.MAX_IMAGES_PER_PROPERTY,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new AppError(400, "Only JPEG, PNG, and WebP images are allowed", "INVALID_FILE_TYPE") as unknown as Error);
      return;
    }
    cb(null, true);
  },
}).array("images", env.MAX_IMAGES_PER_PROPERTY);
