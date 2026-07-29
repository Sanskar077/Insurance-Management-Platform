import crypto from 'node:crypto';
import path from 'node:path';

/**
 * Generates a random, collision-resistant stored filename, preserving only
 * the (already-validated) extension from the original upload. The original
 * filename is never used to build a path — it's stored separately in the DB
 * purely for display, per the spec's "never trust client filenames" rule.
 */
export function generateStoredFileName(originalFileName: string): string {
  const extension = path.extname(originalFileName).toLowerCase();
  return `${crypto.randomUUID()}${extension}`;
}

const ENTITY_SUBDIRECTORY: Record<'CUSTOMER' | 'POLICY' | 'CLAIM', string> = {
  CUSTOMER: 'customers',
  POLICY: 'policies',
  CLAIM: 'claims',
};

export function subdirectoryForEntityType(entityType: 'CUSTOMER' | 'POLICY' | 'CLAIM'): string {
  return ENTITY_SUBDIRECTORY[entityType];
}
