import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from '@config/env.js';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prisma 7's client engine connects through a driver adapter — constructing
// PrismaClient without one throws at startup. keepAlive stops idle pool
// connections from being silently dropped (which surfaced as intermittent
// "Unable to start a transaction in the given time" on the first request
// after an idle period).
const adapter = new PrismaPg({
  connectionString: env.databaseUrl,
  keepAlive: true,
  connectionTimeoutMillis: 10_000,
});

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
    transactionOptions: {
      maxWait: 10_000,
      timeout: 15_000,
    },
  });

if (env.nodeEnv !== 'production') {
  global.__prisma = prisma;
}
