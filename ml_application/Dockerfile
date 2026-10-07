# Multi-Stage Production Dockerfile for ML Fraud Detection Engine
# Part of MLOps Orchestration Pipeline (GitHub -> Jenkins -> Docker -> AWS)

# Stage 1: Build & Dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime Environment
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PATH=/root/.local/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_ENV=production

# Copy installed Python packages from builder
COPY --from=builder /root/.local /root/.local

# Copy ML application code and model artifacts
COPY model.py train.py app.py ./

# Run offline accuracy benchmark validation during container build
RUN python train.py

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Start FastAPI inference microservice with Uvicorn (supports dynamic Render/Railway $PORT)
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2"]
