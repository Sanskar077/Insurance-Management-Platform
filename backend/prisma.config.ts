import 'dotenv/config';
import { defineConfig } from '@prisma/config';

// Prisma 7 removed support for `url = env("DATABASE_URL")` directly inside
// schema.prisma's datasource block (error P1012). The connection URL now
// lives here instead. This file is read by every `prisma` CLI command
// (generate, migrate, studio, etc.) — it does not affect the generated
// PrismaClient at runtime, which continues to read DATABASE_URL from
// process.env exactly as before (see src/lib/prisma.ts / src/config/env.ts).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
