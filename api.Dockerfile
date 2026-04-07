FROM node:20-alpine AS deps
WORKDIR /workspace/fullstack-api-server

COPY fullstack-api-server/package.json fullstack-api-server/package-lock.json ./
COPY fullstack-observatory/packages/metrics ../fullstack-observatory/packages/metrics

RUN npm ci --omit=dev \
  && metrics_deps="$(node -p "const deps = require('../fullstack-observatory/packages/metrics/package.json').dependencies || {}; Object.entries(deps).map(([name, version]) => name + '@' + version).join(' ')")" \
  && if [ -n "$metrics_deps" ]; then npm install --omit=dev --no-save $metrics_deps; fi \
  && rm -rf node_modules/@observatory/metrics \
  && mkdir -p node_modules/@observatory/metrics \
  && cp -R ../fullstack-observatory/packages/metrics/. node_modules/@observatory/metrics/

FROM node:20-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /workspace/fullstack-api-server/node_modules ./node_modules
COPY fullstack-api-server/src ./src
COPY fullstack-api-server/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)throw r.status}).catch(()=>process.exit(1))"

USER appuser
CMD ["node", "src/server.js"]
