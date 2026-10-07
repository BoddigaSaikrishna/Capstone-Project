"""
Automated PyTest Suite for ML Model Validation
Executed by Jenkins CI/CD Pipeline (Stage 2: Model Testing & Validation)
"""

import sys
import os

# Ensure local ml_application directory is in python path
sys.path.insert(0, os.path.dirname(__file__))

from model import FraudDetectionModel, model_instance
from train import generate_benchmark_dataset


def test_model_initialization():
    """Verify model instance loads correctly with valid configuration."""
    assert model_instance.is_loaded is True
    assert model_instance.version == "v2.4.1"
    assert "PyTorch" in model_instance.framework or "Scikit-Learn" in model_instance.framework


def test_legitimate_transaction():
    """Verify normal low-risk transactions are classified as LEGITIMATE."""
    normal_tx = {
        "transaction_id": "tx_normal_001",
        "amount_usd": 42.50,
        "merchant_category": "grocery",
        "cardholder_present": True,
        "foreign_country": False,
        "ip_reputation_score": 0.05,
        "device_fingerprint_anomaly": 0,
        "velocity_last_1hr": 1,
    }
    result = model_instance.predict(normal_tx)
    assert result["prediction"] == "LEGITIMATE_TRANSACTION"
    assert result["risk_level"] == "LOW"
    assert result["probabilities"]["fraud"] < 0.25
    assert result["latency_ms"] < 100.0  # sub-100ms requirement


def test_fraudulent_transaction():
    """Verify suspicious high-value anomalies are classified as FRAUD_DETECTED."""
    fraud_tx = {
        "transaction_id": "tx_fraud_999",
        "amount_usd": 4850.00,
        "merchant_category": "electronics_high_value",
        "cardholder_present": False,
        "foreign_country": True,
        "ip_reputation_score": 0.94,
        "device_fingerprint_anomaly": 1,
        "velocity_last_1hr": 7,
    }
    result = model_instance.predict(fraud_tx)
    assert result["prediction"] == "FRAUD_DETECTED"
    assert result["risk_level"] in ["HIGH", "CRITICAL"]
    assert result["probabilities"]["fraud"] >= 0.80
    assert result["confidence"] >= 90.0


def test_accuracy_benchmark_threshold():
    """
    MLOps Gate: Ensures model accuracy meets or exceeds 95% threshold.
    If accuracy falls below 95%, Jenkins pipeline MUST fail and reject build.
    """
    dataset = generate_benchmark_dataset()
    correct = 0
    for sample, expected in dataset:
        res = model_instance.predict(sample)
        predicted = res["prediction"] == "FRAUD_DETECTED"
        if predicted == expected:
            correct += 1

    accuracy = (correct / len(dataset)) * 100.0
    print(f"\n[PyTest Benchmark] Evaluated accuracy: {accuracy:.1f}% across {len(dataset)} cases.")
    assert accuracy >= 95.0, f"Model accuracy {accuracy}% is below target threshold 95.0%"


if __name__ == "__main__":
    test_model_initialization()
    test_legitimate_transaction()
    test_fraudulent_transaction()
    test_accuracy_benchmark_threshold()
    print("All ML test cases passed successfully!")
