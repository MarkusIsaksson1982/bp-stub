# ================================================
# Stage 1: Dependencies
# ================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Root workspace files
COPY package.json package-lock.json* turbo.json ./

# Workspace package.json files
COPY packages/metrics/package.json ./packages/metrics/
COPY packages/logger/package.json ./packages/logger/
COPY packages/healthcheck/package.json ./packages/healthcheck/
COPY packages/core/package.json ./packages/core/

# App package.json
COPY apps/api-server/package.json ./apps/api-server/

RUN npm ci --omit=dev --ignore-scripts --prefer-offline

# ================================================
# Stage 2: Production
# ================================================
FROM node:20-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

# Copy node_modules (includes workspace symlinks)
COPY --from=deps /app/node_modules ./node_modules

# Copy source code + shared packages
COPY apps/api-server ./apps/api-server
COPY packages/metrics ./packages/metrics
COPY packages/logger ./packages/logger
COPY packages/healthcheck ./packages/healthcheck
COPY packages/core ./packages/core

WORKDIR /app/apps/api-server

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Healthcheck using your existing /api/health route
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=15s \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]