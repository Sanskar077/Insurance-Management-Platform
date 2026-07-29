import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '@/app.js';
import { prisma } from '@lib/prisma.js';

/**
 * End-to-end API flow against the real Express app and database.
 * Uses unique per-run emails so repeated runs never collide, and cleans up
 * the records it created.
 */

const run = Date.now();
const agentEmail = `it-agent-${run}@test.local`;
const customerEmail = `it-cust-${run}@test.local`;
const password = 'Integration1!';

let adminToken: string;
let agentToken: string;
let customerToken: string;
let customerId: string;
let policyId: string;
let claimId: string;
let paymentId: string;

async function login(email: string, pass: string): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ email, password: pass });
  expect(res.status).toBe(200);
  return res.body.data.token as string;
}

beforeAll(async () => {
  // The suite needs one ADMIN. Reuse the seeded one if present, else bootstrap.
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.local', password: 'Admin1234!' });
  if (adminRes.status === 200) {
    adminToken = adminRes.body.data.token;
  } else {
    const boot = await request(app)
      .post('/api/auth/register')
      .send({ name: 'IT Admin', email: 'admin@test.local', password: 'Admin1234!', role: 'ADMIN' });
    expect(boot.status).toBe(201);
    adminToken = boot.body.data.token;
  }
});

afterAll(async () => {
  // Remove records created by this run (reverse dependency order).
  if (claimId) await prisma.claim.deleteMany({ where: { id: claimId } });
  if (paymentId) await prisma.premiumPayment.deleteMany({ where: { id: paymentId } });
  if (policyId) await prisma.policy.deleteMany({ where: { id: policyId } });
  await prisma.customer.deleteMany({ where: { email: customerEmail } });
  await prisma.user.deleteMany({ where: { email: { in: [agentEmail, customerEmail] } } });
  await prisma.$disconnect();
});

describe('auth & RBAC', () => {
  it('blocks public staff registration once an ADMIN exists', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Sneak', email: `sneak-${run}@test.local`, password, role: 'AGENT' });
    expect(res.status).toBe(403);
  });

  it('lets an ADMIN create an AGENT via /api/users', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'IT Agent', email: agentEmail, password, role: 'AGENT' });
    expect(res.status).toBe(201);
    agentToken = await login(agentEmail, password);
  });

  it('registers a CUSTOMER with profile', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'IT Customer',
      email: customerEmail,
      password,
      role: 'CUSTOMER',
      fullName: 'IT Customer',
      dob: '1991-05-05',
      phone: '5559876543',
      address: '9 Integration Way',
    });
    expect(res.status).toBe(201);
    customerToken = res.body.data.token;
  });

  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(401);
  });

  it('forbids a CUSTOMER from listing customers', async () => {
    const res = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });
});

describe('policy lifecycle', () => {
  it('finds the customer id', async () => {
    const res = await request(app)
      .get('/api/customers')
      .query({ search: customerEmail })
      .set('Authorization', `Bearer ${agentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    customerId = res.body.data[0].id;
  });

  it('creates a policy with a readable number', async () => {
    const res = await request(app)
      .post('/api/policies')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        customerId,
        policyType: 'VEHICLE',
        premiumAmount: 300,
        coverageAmount: 20000,
        startDate: '2026-01-01',
        endDate: '2027-01-01',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.policyNumber).toMatch(/^POL-\d{4}-\d{6}$/);
    policyId = res.body.data.id;
  });

  it('scopes the CUSTOMER to their own policies', async () => {
    const res = await request(app)
      .get('/api/policies')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    for (const policy of res.body.data) {
      expect(policy.customerId).toBe(customerId);
    }
  });
});

describe('premium payments', () => {
  it('records a payment', async () => {
    const res = await request(app)
      .post('/api/premium-payments')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        policyId,
        amount: 300,
        dueDate: '2026-06-01',
        paymentDate: '2026-06-02',
        paymentStatus: 'PAID',
        transactionReference: `TXN-IT-${run}`,
      });
    expect(res.status).toBe(201);
    paymentId = res.body.data.id;
  });

  it('rejects a duplicate transaction reference', async () => {
    const res = await request(app)
      .post('/api/premium-payments')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        policyId,
        amount: 300,
        dueDate: '2026-07-01',
        paymentDate: '2026-07-02',
        paymentStatus: 'PAID',
        transactionReference: `TXN-IT-${run}`,
      });
    expect(res.status).toBe(409);
  });
});

describe('claim workflow', () => {
  it('CUSTOMER files a claim on their own policy', async () => {
    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        policyId,
        claimType: 'VEHICLE',
        claimAmount: 900,
        incidentDate: '2026-07-10',
        description: 'Rear bumper damage in a parking incident',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.claimNumber).toMatch(/^CLM-\d{4}-\d{6}$/);
    expect(res.body.data.status).toBe('SUBMITTED');
    claimId = res.body.data.id;
  });

  it('CUSTOMER cannot approve a claim', async () => {
    const res = await request(app)
      .post(`/api/claims/${claimId}/approve`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ approvedAmount: 900 });
    expect(res.status).toBe(403);
  });

  it('rejects approval above the claimed amount', async () => {
    const res = await request(app)
      .post(`/api/claims/${claimId}/approve`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ approvedAmount: 99999 });
    expect(res.status).toBe(400);
  });

  it('AGENT approves then closes the claim', async () => {
    const approve = await request(app)
      .post(`/api/claims/${claimId}/approve`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ approvedAmount: 800 });
    expect(approve.status).toBe(200);
    expect(approve.body.data.status).toBe('APPROVED');

    const close = await request(app)
      .post(`/api/claims/${claimId}/close`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({});
    expect(close.status).toBe(200);
    expect(close.body.data.status).toBe('CLOSED');
  });

  it('blocks transitions out of CLOSED', async () => {
    const res = await request(app)
      .post(`/api/claims/${claimId}/reject`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ remarks: 'should not work' });
    expect(res.status).toBe(400);
  });
});

describe('reports & search', () => {
  it('serves the dashboard summary to staff', async () => {
    const res = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${agentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.customers.total).toBeGreaterThan(0);
  });

  it('denies reports to CUSTOMER', async () => {
    const res = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('global search scopes CUSTOMER results', async () => {
    const res = await request(app)
      .get('/api/search')
      .query({ q: 'POL-' })
      .set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.customers).toHaveLength(0);
    for (const hit of res.body.data.policies) {
      expect(hit.customerName).toBe('IT Customer');
    }
  });
});

describe('error envelope consistency', () => {
  it('404s unknown routes with the standard envelope', async () => {
    const res = await request(app).get('/api/nope').set('Authorization', `Bearer ${agentToken}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('400s malformed JSON bodies', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad');
    expect(res.status).toBe(400);
  });

  it('400s invalid uuid params', async () => {
    const res = await request(app)
      .get('/api/claims/not-a-uuid')
      .set('Authorization', `Bearer ${agentToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });
});
