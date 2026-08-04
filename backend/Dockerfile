# ---- Build stage -----------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# postinstall runs `prisma generate`, which needs the schema present
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# ---- Runtime stage ---------------------------------------------------------
# No install here: `pnpm install --prod` would re-run the postinstall
# (`prisma generate`) without the prisma CLI (a devDependency) and fail.
# Instead, reuse the build stage's node_modules — it already contains the
# generated Prisma client AND the prisma CLI needed for `migrate deploy`.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Local document uploads live here (mount a volume in production)
RUN mkdir -p uploads

EXPOSE 5000
# Apply committed migrations, then start the server
CMD ["sh", "-c", "pnpm db:migrate:deploy && node dist/server.js"]
