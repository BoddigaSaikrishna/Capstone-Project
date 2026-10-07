# Real-Time Fraud Detection Engine (ML Application)

Part of the **DevOps & MLOps Orchestration Pipeline Capstone Project**.

---

## 📌 Architecture Overview

This microservice provides high-throughput, low-latency financial transaction fraud scoring using an ensemble machine learning model served via **FastAPI** and containerized with **Docker**.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1. GITHUB   │ ──► │  2. JENKINS  │ ──► │  3. DOCKER   │ ──► │   4. AWS     │
│ Source Repo  │     │ PyTest Suite │     │ Container    │     │ Cloud EC2    │
│ & Commits    │     │ & Model Lint │     │ Image Build  │     │ /predict API │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

## 🛠️ The 4-Tool Pipeline Workflow

1. **Tool 1: GitHub (`Source Control & Versioning`)**
   - Stores the ML model source code (`model.py`), training logic (`train.py`), API server (`app.py`), and test suite (`test_model.py`).
   - Version controls branches (`main`, `dev-mlops`) and triggers automated CI/CD webhooks upon `git push`.

2. **Tool 2: Jenkins (`Continuous Integration & Model Validation`)**
   - Checks out the repository and executes automated PyTest validation (`pytest test_model.py`).
   - Evaluates the model accuracy gate: **must achieve >= 95% accuracy** before packaging.
   - If tests fail, the pipeline halts immediately, preventing faulty models from reaching production.

3. **Tool 3: Docker (`Containerization & Artifact Registry`)**
   - Packages Python runtime, model weights, dependencies, and FastAPI into a lightweight, isolated image (`fraud-detection-api:v2.4.1`).
   - Pushes the verified container image to Docker Hub / registry (`docker.io/ml-org/fraud-detection-api:v2.4.1`).

4. **Tool 4: AWS (`Cloud Infrastructure & Production Deployment`)**
   - Deploys the Docker container onto an **AWS EC2 Production Instance** (`us-east-1`, port `8000`).
   - Serves real-time inference via REST endpoint `POST http://<aws-host>:8000/predict`.
   - Healthcheck monitored at `GET http://<aws-host>:8000/health`.

---

## 🚀 Running the ML Application Locally

### Direct Python Execution:
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run unit tests
python -m pytest test_model.py -v

# 3. Train & benchmark model
python train.py

# 4. Start FastAPI server
python app.py
# Server runs on http://localhost:8000 (API docs: http://localhost:8000/docs)
```

### Docker Execution:
```bash
# Build image
docker build -t fraud-detection-api:v2.4 .

# Run container
docker run -d -p 8000:8000 --name fraud-api fraud-detection-api:v2.4

# Test inference
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"amount_usd": 4850.0, "foreign_country": true, "ip_reputation_score": 0.94}'
```
