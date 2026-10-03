# ============================================================
# HS Education — Backend Service
# Northflank: set build context to "backend-service" folder
# ============================================================

FROM node:20-alpine

WORKDIR /app

COPY backend/js/package.json backend/js/package-lock.json* ./
RUN npm install --omit=dev

COPY backend/js/ ./
COPY backend/app_db ./app_db

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-5000}/healthz || exit 1

EXPOSE 5000

CMD ["node", "server.js"]
