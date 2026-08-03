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
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist

# Local document uploads live here (mount a volume in production)
RUN mkdir -p uploads

EXPOSE 5000
# Apply committed migrations, then start the server
CMD ["sh", "-c", "pnpm db:migrate:deploy && node dist/server.js"]
