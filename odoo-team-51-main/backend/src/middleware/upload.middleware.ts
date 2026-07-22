import fs from "fs";
import path from "path";
import multer from "multer";
import { AppError } from "./errorHandler";

// Stored outside src/ so it survives `tsc` builds and isn't picked up by the compiler.
export const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");
const PHOTOS_DIR = path.join(UPLOAD_ROOT, "photos");

fs.mkdirSync(PHOTOS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PHOTOS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user-${req.user!.userId}-${Date.now()}${ext}`);
  },
});

export const uploadPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new AppError(400, "Photo must be a JPEG, PNG, WebP, or GIF image"));
      return;
    }
    cb(null, true);
  },
}).single("photo");

const productPhotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PHOTOS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${req.params.id}-${Date.now()}${ext}`);
  },
});

export const uploadProductPhoto = multer({
  storage: productPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new AppError(400, "Photo must be a JPEG, PNG, WebP, or GIF image"));
      return;
    }
    cb(null, true);
  },
}).single("photo");
