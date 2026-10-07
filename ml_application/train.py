"""
ML Model Training & Accuracy Benchmark Script
Used in CI/CD pipeline to validate accuracy thresholds before deployment.
"""

import json
import os
import sys
from model import FraudDetectionModel


def generate_benchmark_dataset():
    """Generates synthetic labeled financial transactions for model validation."""
    dataset = [
        # Legitimate transactions
        ({"amount_usd": 25.50, "foreign_country": False, "cardholder_present": True, "ip_reputation_score": 0.05, "device_fingerprint_anomaly": 0, "velocity_last_1hr": 1}, False),
        ({"amount_usd": 120.00, "foreign_country": False, "cardholder_present": True, "ip_reputation_score": 0.02, "device_fingerprint_anomaly": 0, "velocity_last_1hr": 2}, False),
        ({"amount_usd": 450.00, "foreign_country": False, "cardholder_present": False, "ip_reputation_score": 0.12, "device_fingerprint_anomaly": 0, "velocity_last_1hr": 1}, False),
        ({"amount_usd": 15.00, "foreign_country": False, "cardholder_present": True, "ip_reputation_score": 0.01, "device_fingerprint_anomaly": 0, "velocity_last_1hr": 0}, False),
        ({"amount_usd": 85.00, "foreign_country": False, "cardholder_present": True, "ip_reputation_score": 0.08, "device_fingerprint_anomaly": 0, "velocity_last_1hr": 2}, False),
        ({"amount_usd": 320.00, "foreign_country": False, "cardholder_present": True, "ip_reputation_score": 0.04, "device_fingerprint_anomaly": 0, "velocity_last_1hr": 3}, False),
        ({"amount_usd": 50.00, "foreign_country": False, "cardholder_present": True, "ip_reputation_score": 0.03, "device_fingerprint_anomaly": 0, "velocity_last_1hr": 1}, False),
        ({"amount_usd": 1500.00, "foreign_country": False, "cardholder_present": True, "ip_reputation_score": 0.05, "device_fingerprint_anomaly": 0, "velocity_last_1hr": 1}, False),
        ({"amount_usd": 12.99, "foreign_country": False, "cardholder_present": True, "ip_reputation_score": 0.01, "device_fingerprint_anomaly": 0, "velocity_last_1hr": 0}, False),
        ({"amount_usd": 99.00, "foreign_country": False, "cardholder_present": True, "ip_reputation_score": 0.02, "device_fingerprint_anomaly": 0, "velocity_last_1hr": 1}, False),
        # Fraudulent transactions
        ({"amount_usd": 4850.00, "foreign_country": True, "cardholder_present": False, "ip_reputation_score": 0.94, "device_fingerprint_anomaly": 1, "velocity_last_1hr": 7}, True),
        ({"amount_usd": 3500.00, "foreign_country": True, "cardholder_present": False, "ip_reputation_score": 0.88, "device_fingerprint_anomaly": 1, "velocity_last_1hr": 9}, True),
        ({"amount_usd": 9200.00, "foreign_country": True, "cardholder_present": False, "ip_reputation_score": 0.96, "device_fingerprint_anomaly": 1, "velocity_last_1hr": 6}, True),
        ({"amount_usd": 2750.00, "foreign_country": True, "cardholder_present": False, "ip_reputation_score": 0.82, "device_fingerprint_anomaly": 1, "velocity_last_1hr": 5}, True),
        ({"amount_usd": 6100.00, "foreign_country": True, "cardholder_present": False, "ip_reputation_score": 0.91, "device_fingerprint_anomaly": 1, "velocity_last_1hr": 8}, True),
    ]
    return dataset


def evaluate_model():
    """Evaluates the model against benchmark test cases and exports evaluation report."""
    print("=" * 60)
    print("[MLOps CI/CD] Starting Model Training & Benchmark Evaluation")
    print("=" * 60)

    model = FraudDetectionModel(version="v2.4.1")
    dataset = generate_benchmark_dataset()

    correct = 0
    total = len(dataset)

    for i, (sample, expected_fraud) in enumerate(dataset, 1):
        res = model.predict(sample)
        predicted_fraud = res["prediction"] == "FRAUD_DETECTED"
        is_correct = (predicted_fraud == expected_fraud)
        if is_correct:
            correct += 1
        status_str = "PASS" if is_correct else "FAIL"
        print(f"[{status_str}] Sample #{i:02d} | Amount: ${sample['amount_usd']:>7.2f} | Expected: {expected_fraud} | Predicted: {predicted_fraud} (Conf: {res['confidence']}%)")

    accuracy = round((correct / total) * 100, 1)
    print("-" * 60)
    print(f"Final Evaluation Accuracy: {accuracy}% ({correct}/{total} passed)")
    print(f"Target Threshold: >= 95.0%")

    metrics = {
        "model_name": "Real-Time Fraud Detection Engine",
        "version": "v2.4.1",
        "framework": "PyTorch 2.2 / Scikit-Learn Ensemble",
        "accuracy_pct": accuracy,
        "samples_evaluated": total,
        "passed": correct,
        "ci_status": "APPROVED" if accuracy >= 95.0 else "REJECTED",
    }

    metrics_path = os.path.join(os.path.dirname(__file__), "model_metrics.json")
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Exported evaluation metrics to: {metrics_path}")
    print("=" * 60)
    return accuracy >= 95.0


if __name__ == "__main__":
    success = evaluate_model()
    sys.exit(0 if success else 1)
