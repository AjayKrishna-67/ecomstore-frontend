# =============================================================================
# Dependencies — install with bun (fast, uses bun.lock)
# =============================================================================
FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# =============================================================================
# Builder — run `next build` under Node, not Bun. Bun on Alpine fails the
# Next.js 14 app-router prerender pass for /404 and /500 (throws a misleading
# "<Html> should not be imported outside of pages/_document" error). Node is
# the runtime Next.js is actually tested against.
# =============================================================================
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN node node_modules/next/dist/bin/next build

# =============================================================================
# Runner — Node 20 alpine, slim, runs the standalone server
# =============================================================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8004

ENV PORT=8004
ENV HOSTNAME="0.0.0.0"
ENV VENDURE_API_URL="https://prabhasaaridesigns.com/shop-api"
ENV CHANNEL_TOKEN="prabas-aari"

CMD ["node", "server.js"]
