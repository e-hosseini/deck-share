# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Dummy DATABASE_URL so PrismaClient can be instantiated during build (Next.js runs
# layout code at build time). Runtime uses the real URL from the environment.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

COPY . .
RUN npx prisma generate
RUN yarn build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Install Prisma CLI, dotenv, and tsx so "prisma migrate deploy" and "npm run db:seed" work
RUN npm install prisma@7.4.1 dotenv@17.3.1 tsx@4.21.0 && chown -R nextjs:nodejs /app/node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
