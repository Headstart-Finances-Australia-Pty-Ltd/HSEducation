# ============================================================
# HS Education — Dockerfile (Single Service)
# Builds React then serves everything from one Express server
# One container, one port (3000), one Northflank service
#
# Northflank settings:
#   Dockerfile path : Dockerfile
#   Build context   : . (root)
#   Port            : 3000 — HTTP — Public ON
# ============================================================

# ── Stage 1: Build React ─────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/public ./public
COPY frontend/src    ./src

ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
ENV CI=false
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN npm run build

# ── Stage 2: Express serves React + API ──────────────────
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/js/package.json backend/js/package-lock.json ./
RUN npm install --omit=dev

# Copy backend source
COPY backend/js/ ./
# SQL schema + seed — applied automatically on first database connection
COPY backend/app_db ./app_db

# Copy React build into backend's public folder
# Express serves this as static files
COPY --from=builder /build/build ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/healthz || exit 1

CMD ["node", "server.js"]
