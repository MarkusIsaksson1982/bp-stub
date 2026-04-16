FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* turbo.json ./
COPY packages/metrics/package.json ./packages/metrics/
COPY packages/logger/package.json ./packages/logger/
COPY packages/healthcheck/package.json ./packages/healthcheck/
COPY packages/core/package.json ./packages/core/
COPY apps/api-server/package.json ./apps/api-server/

RUN npm install --omit=dev --ignore-scripts

FROM node:22-alpine AS runner

RUN apk add --no-cache curl ca-certificates

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY apps/api-server ./apps/api-server
COPY packages/metrics ./packages/metrics
COPY packages/logger ./packages/logger
COPY packages/healthcheck ./packages/healthcheck
COPY packages/core ./packages/core

WORKDIR /app/apps/api-server

ENV NODE_ENV=production
ENV PORT=3000
ENV SERVICE_NAME=foundation-api

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=15s \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]