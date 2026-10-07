# FullStack Cloud Application — 4-Tool DevOps Integration

This standalone FullStack microservice demonstrates the complete end-to-end integration of the **4 core DevOps tools**:
**GitHub ➔ Jenkins ➔ Docker ➔ AWS EC2**.

---

## 🛠️ The 4 Tools in this Application

| Tool | Role in this Application | File / Implementation |
|---|---|---|
| **1. GitHub** | Source code management, commit versioning, webhook trigger | `.git`, repo push triggers Jenkins job |
| **2. Jenkins** | Automated CI pipeline: dependency resolution & unit testing | [Jenkinsfile](Jenkinsfile), executes `node test/api.test.js` |
| **3. Docker** | Multi-stage container packaging & environment parity | [Dockerfile](Dockerfile), containerizes app on port 3000 |
| **4. AWS** | Production cloud host: EC2 compute, S3 static assets, CloudWatch logs | EC2 instance target `54.210.89.14`, port 3000 |

---

## 🏃 Running the Application

### Option A: Direct Node.js Run
```bash
cd fullstack_application
npm install
npm test      # Runs Jenkins CI test suite (5 automated checks)
npm start     # Starts app at http://localhost:3000
```

### Option B: Docker Container Run
```bash
cd fullstack_application
docker build -t fullstack-demo-app:v1.0 .
docker run -d -p 3000:3000 --name fullstack-demo-app fullstack-demo-app:v1.0
```
Open **`http://localhost:3000`** in your browser.

### Option C: Automated Pipeline Run (PowerShell / Windows)
```powershell
.\deploy.ps1 -Type nodejs -Name fullstack-demo-app -Tag v1.0
```

---

## 📡 API Endpoints

- `GET /` — FullStack Web User Interface
- `GET /health` — Health check endpoint (Docker & AWS ALB)
- `GET /api/items` — Product catalog JSON REST API
- `POST /api/items` — Add new item to catalog
- `GET /api/telemetry` — Pipeline verification metadata (GitHub, Jenkins, Docker, AWS)
