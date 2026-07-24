import { prisma } from '@lib/prisma.js';

/**
 * Generates a unique, human-readable policy number in the form
 * POL-<year>-<6-digit sequence>, e.g. POL-2026-000001. The sequence
 * (`policy_number_seq`, created in the Policy Management migration) is
 * global and monotonically increasing — it is not reset per year — so
 * uniqueness is guaranteed by the database itself, not by application logic.
 * The UUID primary key remains the internal identifier; this is display-only.
 */
export async function generatePolicyNumber(): Promise<string> {
  const [{ nextval }] = await prisma.$queryRaw<[{ nextval: bigint }]>`
    SELECT nextval('policy_number_seq')
  `;
  const year = new Date().getFullYear();
  const sequence = nextval.toString().padStart(6, '0');
  return `POL-${year}-${sequence}`;
}
