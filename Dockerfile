# ── Stage 1: Build React Frontend ────────────────────────────
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ── Stage 2: Python Backend + Serve Frontend ─────────────────
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy built React frontend into /app/static
COPY --from=frontend-build /app/frontend/build ./static

# Create upload directories
RUN mkdir -p uploads/datasets uploads/models

EXPOSE 8000

# Render sets PORT env var; default to 8000
CMD uvicorn app.main:create_app --host 0.0.0.0 --port ${PORT:-8000} --factory
