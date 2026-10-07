"""
FastAPI Real-Time Inference Microservice
Serves the Real-Time Fraud Detection Engine (v2.4.1) for MLOps Pipeline
"""

import time
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model import model_instance

app = FastAPI(
    title="Real-Time Fraud Detection Engine",
    description="High-throughput transactional risk evaluation microservice for MLOps pipeline",
    version="v2.4.1",
)

# Enable CORS for local React dashboard and external API clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()
REQUEST_COUNT = 0


class TransactionPayload(BaseModel):
    transaction_id: Optional[str] = Field(default=None, description="Unique transaction reference ID")
    amount_usd: float = Field(..., ge=0.0, description="Transaction monetary amount in USD")
    merchant_category: Optional[str] = Field(default="retail", description="Merchant category classification")
    cardholder_present: Optional[bool] = Field(default=True, description="Physical card presence flag")
    foreign_country: Optional[bool] = Field(default=False, description="International transaction flag")
    ip_reputation_score: Optional[float] = Field(default=0.1, ge=0.0, le=1.0, description="IP risk score (0=safe, 1=malicious)")
    device_fingerprint_anomaly: Optional[int] = Field(default=0, ge=0, description="Device fingerprint mismatch count")
    velocity_last_1hr: Optional[int] = Field(default=1, ge=0, description="Transaction velocity within past hour")


@app.get("/")
def root():
    """Root service information."""
    return {
        "service": "Real-Time Fraud Detection Engine",
        "version": model_instance.version,
        "framework": model_instance.framework,
        "status": "ONLINE",
        "docs_url": "/docs",
        "pipeline": "GitHub -> Jenkins -> Docker -> AWS",
    }


@app.get("/health")
def health_check():
    """Health check endpoint for Docker & AWS load balancers."""
    uptime_sec = round(time.time() - START_TIME, 1)
    return {
        "status": "healthy",
        "model_loaded": model_instance.is_loaded,
        "version": model_instance.version,
        "uptime_seconds": uptime_sec,
        "total_inferences": REQUEST_COUNT,
    }


@app.post("/predict")
def predict_fraud(payload: TransactionPayload):
    """
    Real-time fraud scoring inference endpoint.
    Accepts transaction metadata and returns fraud probability, risk score, and classification.
    """
    global REQUEST_COUNT
    REQUEST_COUNT += 1

    try:
        data_dict = payload.model_dump()
        result = model_instance.predict(data_dict)
        return {
            "status": 200,
            "statusText": "OK",
            "model": "Real-Time Fraud Detection Engine",
            "version": model_instance.version,
            "framework": model_instance.framework,
            "latencyMs": f"{result['latency_ms']} ms",
            "servingWorker": "AWS g4dn.xlarge (TorchServe / Uvicorn Worker #1)",
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "riskLevel": result["risk_level"],
            "probabilities": result["probabilities"],
            "timestamp": result["timestamp"],
            "scoredFeatures": result["scored_features"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@app.get("/metrics")
def get_telemetry():
    """Prometheus-compatible telemetry metrics."""
    return {
        "total_requests": REQUEST_COUNT,
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "model_version": model_instance.version,
        "accuracy_target": 0.968,
        "memory_status": "optimal",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
