# Multi-stage production build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all dependencies
RUN npm install

# Copy source files
COPY server ./server
COPY client ./client
COPY scripts ./scripts

# Build frontend and backend
RUN npm run build --workspace=client
RUN npm run build --workspace=server

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled assets from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/src/db/schema.sql ./server/dist/db/schema.sql
COPY --from=builder /app/server/uploads ./server/uploads
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 4000

CMD ["node", "server/dist/index.js"]
