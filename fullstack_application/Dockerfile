# ============================================================
# Dockerfile — FullStack Application (Node.js & Pure HTTP)
# Pipeline: GitHub -> Jenkins -> Docker -> AWS EC2
# ============================================================

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    APP_ENV=production \
    AWS_DEFAULT_REGION=us-east-1

# Create non-root user for security compliance
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm install --omit=dev 2>/dev/null || true

COPY . .

USER appuser

EXPOSE 3000

# Docker Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
