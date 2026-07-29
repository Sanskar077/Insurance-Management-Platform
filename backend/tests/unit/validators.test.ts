import { describe, expect, it } from 'vitest';
import { createPolicySchema, policySearchQuerySchema } from '@validators/policy.validator.js';
import { createCustomerSchema } from '@validators/customer.validator.js';
import { registerSchema } from '@validators/auth.validator.js';
import { globalSearchQuerySchema } from '@validators/search.validator.js';
import { createUserSchema, updateUserRoleSchema } from '@validators/user.validator.js';

describe('createPolicySchema', () => {
  const valid = {
    customerId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    policyType: 'HEALTH',
    premiumAmount: 250,
    coverageAmount: 50000,
    startDate: '2026-01-01',
    endDate: '2027-01-01',
  };

  it('accepts a valid policy', () => {
    expect(createPolicySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects endDate before startDate', () => {
    expect(
      createPolicySchema.safeParse({ ...valid, startDate: '2027-01-01', endDate: '2026-01-01' })
        .success,
    ).toBe(false);
  });
});

describe('policySearchQuerySchema', () => {
  it('coerces premium range filters', () => {
    const parsed = policySearchQuerySchema.parse({ minPremium: '100', maxPremium: '900' });
    expect(parsed.minPremium).toBe(100);
    expect(parsed.maxPremium).toBe(900);
  });

  it('rejects negative premium filters', () => {
    expect(policySearchQuerySchema.safeParse({ minPremium: -1 }).success).toBe(false);
  });
});

describe('createCustomerSchema', () => {
  it('rejects an invalid phone', () => {
    const result = createCustomerSchema.safeParse({
      fullName: 'Test Person',
      email: 'test@example.com',
      phone: 'abc',
      address: '1 Main Street',
      dob: '1990-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('lowercases the email', () => {
    const parsed = createCustomerSchema.parse({
      fullName: 'Test Person',
      email: 'Test@Example.COM',
      phone: '5551234567',
      address: '1 Main Street',
      dob: '1990-01-01',
    });
    expect(parsed.email).toBe('test@example.com');
  });
});

describe('registerSchema', () => {
  it('requires customer profile fields for CUSTOMER role', () => {
    const result = registerSchema.safeParse({
      name: 'A Customer',
      email: 'cust@example.com',
      password: 'Password1!',
      role: 'CUSTOMER',
    });
    expect(result.success).toBe(false);
  });

  it('does not require profile fields for AGENT role', () => {
    const result = registerSchema.safeParse({
      name: 'An Agent',
      email: 'agent@example.com',
      password: 'Password1!',
      role: 'AGENT',
    });
    expect(result.success).toBe(true);
  });
});

describe('globalSearchQuerySchema', () => {
  it('requires at least 2 characters', () => {
    expect(globalSearchQuerySchema.safeParse({ q: 'a' }).success).toBe(false);
    expect(globalSearchQuerySchema.safeParse({ q: 'ab' }).success).toBe(true);
  });

  it('caps per-category limit at 10', () => {
    expect(globalSearchQuerySchema.safeParse({ q: 'test', limit: 11 }).success).toBe(false);
  });
});

describe('user admin schemas', () => {
  it('createUserSchema only allows staff roles', () => {
    const base = { name: 'Staff', email: 's@example.com', password: 'Password1!' };
    expect(createUserSchema.safeParse({ ...base, role: 'AGENT' }).success).toBe(true);
    expect(createUserSchema.safeParse({ ...base, role: 'CUSTOMER' }).success).toBe(false);
  });

  it('updateUserRoleSchema rejects CUSTOMER', () => {
    expect(updateUserRoleSchema.safeParse({ role: 'CUSTOMER' }).success).toBe(false);
  });
});
