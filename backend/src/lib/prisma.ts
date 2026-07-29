import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from '@config/env.js';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prisma 7's client engine connects through a driver adapter — constructing
// PrismaClient without one throws at startup.
const adapter = new PrismaPg({ connectionString: env.databaseUrl });

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.nodeEnv !== 'production') {
  global.__prisma = prisma;
}
