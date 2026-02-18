# =============================================================================
# KawaMyCenter Backend - Production Dockerfile
# Multi-stage build for Node.js/Fastify + Prisma + PostgreSQL
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: deps
# Responsibility: Install all dependencies (including devDependencies)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files for maximum cache efficiency
COPY package*.json ./

# Install all dependencies (devDependencies needed for prisma generate)
RUN npm ci --silent && npm cache clean --force

# -----------------------------------------------------------------------------
# STAGE 2: build
# Responsibility: Generate Prisma client and prepare application
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files and source code
COPY package*.json ./
COPY . .

# Generate Prisma client
RUN npx prisma generate

# -----------------------------------------------------------------------------
# STAGE 3: migrate
# Responsibility: Execute database migrations
# Container is ephemeral - runs once and exits
# -----------------------------------------------------------------------------
FROM node:20-alpine AS migrate

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy dependencies and generated prisma client
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Copy prisma schema and package files
COPY package*.json ./
COPY prisma ./prisma

# Migration command - fails explicitly on error
CMD ["npx", "prisma", "migrate", "deploy"]

# -----------------------------------------------------------------------------
# STAGE 4: runtime
# Responsibility: Serve the application with minimal footprint
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runtime

WORKDIR /app

# Install wget for healthcheck and openssl for Prisma
RUN apk add --no-cache wget openssl

# Create non-root user for security (principle of least privilege)
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy production dependencies only
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Copy prisma schema (needed for runtime)
COPY prisma ./prisma

# Copy application code
COPY . .

# Set ownership of app directory to nodejs user
RUN chown -R nodejs:nodejs /app

# Regenerate Prisma client in runtime (needed for engine)
RUN npx prisma generate

# Switch to non-root user
USER nodejs

# Expose port (parametrized via environment variable)
EXPOSE ${BACKEND_PORT}

# Healthcheck for container monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${BACKEND_PORT}/health || exit 1

# Start application
CMD ["node", "src/server.js"]
