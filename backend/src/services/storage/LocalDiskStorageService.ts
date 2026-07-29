import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StorageService } from '@services/storage/StorageService.js';

const ALLOWED_SUBDIRECTORIES = ['customers', 'policies', 'claims'] as const;
type AllowedSubdirectory = (typeof ALLOWED_SUBDIRECTORIES)[number];

function assertSafeSegment(segment: string, label: string): void {
  // Reject path traversal / separators outright — every path component we
  // build from user-influenced input (subdirectory, storedFileName) must be
  // a single, literal filename-safe segment, never something that could
  // escape the uploads root.
  if (
    segment.includes('..') ||
    segment.includes('/') ||
    segment.includes('\\') ||
    segment.trim() === ''
  ) {
    throw new Error(`Invalid ${label}: "${segment}"`);
  }
}

export class LocalDiskStorageService implements StorageService {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  private resolveAbsolutePath(subdirectory: string, storedFileName: string): string {
    assertSafeSegment(subdirectory, 'storage subdirectory');
    assertSafeSegment(storedFileName, 'stored file name');

    if (!ALLOWED_SUBDIRECTORIES.includes(subdirectory as AllowedSubdirectory)) {
      throw new Error(`Unknown storage subdirectory: "${subdirectory}"`);
    }

    const absolutePath = path.resolve(this.rootDir, subdirectory, storedFileName);

    // Defense in depth: even after the segment checks above, confirm the
    // resolved path is still contained within the uploads root before ever
    // touching the filesystem.
    if (!absolutePath.startsWith(path.resolve(this.rootDir) + path.sep)) {
      throw new Error('Resolved storage path escapes the uploads root');
    }

    return absolutePath;
  }

  async save(subdirectory: string, storedFileName: string, buffer: Buffer): Promise<string> {
    const absolutePath = this.resolveAbsolutePath(subdirectory, storedFileName);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);
    // Store a storage-backend-agnostic relative path, not the absolute
    // filesystem path — never expose real disk locations (see spec's
    // Security section).
    return path.join(subdirectory, storedFileName);
  }

  async read(storagePath: string): Promise<Buffer> {
    const [subdirectory, storedFileName] = storagePath.split(path.sep);
    const absolutePath = this.resolveAbsolutePath(subdirectory, storedFileName);
    return fs.readFile(absolutePath);
  }

  async delete(storagePath: string): Promise<void> {
    const [subdirectory, storedFileName] = storagePath.split(path.sep);
    const absolutePath = this.resolveAbsolutePath(subdirectory, storedFileName);
    await fs.rm(absolutePath, { force: true });
  }
}
