import app from './app.js';
import { env } from '@config/env.js';
import { prisma } from '@lib/prisma.js';
import { logger } from '@utils/logger.js';

const server = app.listen(env.port, () => {
  logger.info(`Server running on http://localhost:${env.port} (${env.nodeEnv})`);
});

/** Graceful shutdown — close the HTTP server, then the database pool. */
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — shutting down`);
  server.close(() => {
    prisma
      .$disconnect()
      .catch((err: unknown) => logger.error('Error disconnecting Prisma', err))
      .finally(() => process.exit(0));
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
