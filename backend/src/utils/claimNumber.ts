import { prisma } from '@lib/prisma.js';

/**
 * Generates a unique, human-readable claim number in the form
 * CLM-<year>-<6-digit sequence>, e.g. CLM-2026-000001. Mirrors
 * generatePolicyNumber (utils/policyNumber.ts) — the sequence
 * (`claim_number_seq`, created in the Claim Management migration) is global
 * and monotonically increasing, not reset per year, so uniqueness is
 * guaranteed by the database. The UUID primary key remains the internal
 * identifier; this is display-only.
 */
export async function generateClaimNumber(): Promise<string> {
  const [{ nextval }] = await prisma.$queryRaw<[{ nextval: bigint }]>`
    SELECT nextval('claim_number_seq')
  `;
  const year = new Date().getFullYear();
  const sequence = nextval.toString().padStart(6, '0');
  return `CLM-${year}-${sequence}`;
}
