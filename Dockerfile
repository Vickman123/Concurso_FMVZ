# Multi-stage production build for FMVZ Halloween Contest
# Stage 1: Build Frontend and Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package manifests
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install build dependencies
RUN npm install

# Copy source code
COPY server ./server
COPY client ./client
COPY scripts ./scripts

# Build frontend and backend
RUN npm run build --workspace=client
RUN npm run build --workspace=server

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/server/uploads
ENV STORAGE_MODE=disk

# Install production dependencies only
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm install --omit=dev

# Copy compiled assets and database migration files
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/src/db/schema.sql ./server/dist/db/schema.sql
COPY --from=builder /app/server/src/db/migrations ./server/dist/db/migrations
COPY --from=builder /app/server/uploads ./server/uploads
COPY --from=builder /app/client/dist ./client/dist

# Ensure uploads directory exists and set ownership to node user
RUN mkdir -p /app/server/uploads && chown -R node:node /app

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["node", "server/dist/index.js"]
