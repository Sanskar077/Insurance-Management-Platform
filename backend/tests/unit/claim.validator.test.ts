import { describe, expect, it } from 'vitest';
import {
  approveClaimSchema,
  claimSearchQuerySchema,
  createClaimSchema,
  rejectClaimSchema,
  updateClaimSchema,
} from '@validators/claim.validator.js';

const validCreate = {
  policyId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  claimType: 'HEALTH',
  claimAmount: 1200,
  incidentDate: '2026-07-01',
  description: 'Hospitalization expenses following an accident',
};

describe('createClaimSchema', () => {
  it('accepts a valid claim', () => {
    expect(createClaimSchema.safeParse(validCreate).success).toBe(true);
  });

  it('rejects a non-uuid policyId', () => {
    expect(createClaimSchema.safeParse({ ...validCreate, policyId: 'nope' }).success).toBe(false);
  });

  it('rejects zero/negative amounts', () => {
    expect(createClaimSchema.safeParse({ ...validCreate, claimAmount: 0 }).success).toBe(false);
    expect(createClaimSchema.safeParse({ ...validCreate, claimAmount: -5 }).success).toBe(false);
  });

  it('rejects incidentDate after claimDate', () => {
    const result = createClaimSchema.safeParse({
      ...validCreate,
      incidentDate: '2026-07-20',
      claimDate: '2026-07-10',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a too-short description', () => {
    expect(createClaimSchema.safeParse({ ...validCreate, description: 'short' }).success).toBe(
      false,
    );
  });
});

describe('updateClaimSchema', () => {
  it('rejects an empty update', () => {
    expect(updateClaimSchema.safeParse({}).success).toBe(false);
  });

  it('only allows UNDER_REVIEW as a direct status', () => {
    expect(updateClaimSchema.safeParse({ status: 'UNDER_REVIEW' }).success).toBe(true);
    expect(updateClaimSchema.safeParse({ status: 'APPROVED' }).success).toBe(false);
  });
});

describe('approve/reject schemas', () => {
  it('approve requires a positive approvedAmount', () => {
    expect(approveClaimSchema.safeParse({ approvedAmount: 500 }).success).toBe(true);
    expect(approveClaimSchema.safeParse({ approvedAmount: 0 }).success).toBe(false);
  });

  it('reject requires remarks', () => {
    expect(rejectClaimSchema.safeParse({}).success).toBe(false);
    expect(rejectClaimSchema.safeParse({ remarks: 'Not covered by the policy' }).success).toBe(
      true,
    );
  });
});

describe('claimSearchQuerySchema', () => {
  it('applies defaults', () => {
    const parsed = claimSearchQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(10);
    expect(parsed.sortBy).toBe('claimDate');
    expect(parsed.sortOrder).toBe('desc');
  });

  it('caps limit at 100', () => {
    expect(claimSearchQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });

  it('coerces numeric amount filters', () => {
    const parsed = claimSearchQuerySchema.parse({ minAmount: '100', maxAmount: '500' });
    expect(parsed.minAmount).toBe(100);
    expect(parsed.maxAmount).toBe(500);
  });
});
