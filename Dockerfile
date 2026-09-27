# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Backend Server with Built Static Frontend
FROM node:20-alpine AS runner
WORKDIR /app

# Copy backend dependencies and source
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm ci --only=production
RUN npm --prefix backend ci --only=production

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "backend/src/server.js"]
