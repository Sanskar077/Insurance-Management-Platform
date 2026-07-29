import multer from 'multer';
import path from 'node:path';
import { BadRequestError } from '@utils/AppError.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB, per spec.

// Checked by both MIME type and extension — a renamed executable can spoof
// one but not both easily, and this is defense-in-depth, not a substitute
// for a real virus scan (explicitly out of scope for Day 7).
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

// Memory storage: Multer only buffers the file in RAM and hands it to
// StorageService.save() afterward. Multer never touches the disk directly,
// keeping all storage decisions (path, filename) behind the StorageService
// abstraction as required by the Day 7 architecture.
const storage = multer.memoryStorage();

function fileFilter(
  _req: unknown,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
): void {
  const extension = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(extension)) {
    callback(new BadRequestError('Only PDF, JPG, JPEG, and PNG files are allowed'));
    return;
  }

  callback(null, true);
}

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});
