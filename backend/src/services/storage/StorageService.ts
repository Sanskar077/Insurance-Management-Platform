/**
 * Abstraction over "where uploaded file bytes physically live". The Day 7
 * spec requires local disk storage now, but everything above this interface
 * (DocumentService, controllers, routes) only ever talks to StorageService —
 * never to `fs` directly — so a future S3/Azure/Cloudinary implementation
 * can be swapped in by implementing this interface and changing one
 * instantiation, with zero changes to business logic.
 */
export interface StorageService {
  /**
   * Persists a file buffer under a given entity-scoped subdirectory and
   * returns the storage path to record in the database. The returned path
   * is a logical identifier (e.g. a relative path) — never an absolute
   * filesystem path — so it stays storage-backend-agnostic.
   */
  save(subdirectory: string, storedFileName: string, buffer: Buffer): Promise<string>;

  /** Reads a previously-saved file back into memory for download. */
  read(storagePath: string): Promise<Buffer>;

  /** Permanently removes the underlying file. */
  delete(storagePath: string): Promise<void>;
}
