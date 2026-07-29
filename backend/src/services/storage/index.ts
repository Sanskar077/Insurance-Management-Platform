import path from 'node:path';
import { LocalDiskStorageService } from '@services/storage/LocalDiskStorageService.js';
import type { StorageService } from '@services/storage/StorageService.js';

// Local disk today (Day 7 spec). Swapping to S3/Azure/Cloudinary later means
// implementing StorageService and changing only this line — nothing else in
// the codebase references LocalDiskStorageService directly.
const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

export const storageService: StorageService = new LocalDiskStorageService(UPLOADS_ROOT);
