import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const SALT_ROUNDS = 12;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generates a random temporary password for accounts created by staff on a
 * customer's behalf (the customer should change it on first login — password
 * reset is out of scope until a later session).
 */
export function generateTemporaryPassword(): string {
  return crypto.randomBytes(12).toString('base64url');
}
