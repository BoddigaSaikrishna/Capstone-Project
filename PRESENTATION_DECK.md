# Capstone Project Presentation Deck (Review – 1)
## Title: DevOps & MLOps Orchestration Pipeline Dashboard
**Academic Review Period:** 17th – 22nd August 2026  
**Team Lead & Presenter:** Boddiga Sai Krishna  
**Domain:** DevOps Engineering, MLOps & Full-Stack Cloud Systems  

---

## 📊 Slide-by-Slide Presentation Structure

---

### **SLIDE 1: Title & Team Information**
- **Project Title:** DevOps & MLOps Orchestration Pipeline Dashboard
- **Sub-Title:** Unified Control Center for Infrastructure Telemetry, CI/CD Automation & ML Lifecycle Management
- **Department:** Computer Science & Engineering
- **Review Stage:** Capstone Review – 1 (Project Initiation & Planning)
- **Team Lead:** Boddiga Sai Krishna
- **Project Guide:** [Guide Name]
- **Date:** August 2026

---

### **SLIDE 2: Problem Statement & Motivation**
- **The Core Challenge:** Modern development teams operate across separate, siloed tools—GitHub for source code, Jenkins for CI/CD builds, Docker/Kubernetes for container orchestration, and MLflow/TensorBoard for ML model tracking.
- **Impact:** High cognitive load, context-switching fatigue, delayed deployment visibility, and CORS security issues when integrating local automation tools with cloud dashboards.
- **Problem Statement:** *"Traditional DevOps platforms lack unified integration with machine learning lifecycles, causing fragmented telemetry, delayed build feedback, and CORS cross-origin integration barriers."*

---

### **SLIDE 3: SMART Objectives**
- **S - Specific:** Develop a single-tenant web dashboard integrating live **GitHub REST API v3**, **Jenkins CI/CD Server API**, and real-time infrastructure telemetry.
- **M - Measurable:** Achieve `< 200ms` API response latency, 100% CORS-bypassed proxy routing, and 2.5-second live telemetry refresh streams.
- **A - Achievable:** Engineered using **React 18, TypeScript, Vite, Tailwind CSS**, and **Vite Reverse Proxy** architecture.
- **R - Relevant:** Streamlines continuous deployment pipelines and machine learning model version tracking under a single interface.
- **T - Time-Bound:** Complete Review-1 initiation in August 2026, feature integration by October 2026, and final deployment by November 2026.

---

### **SLIDE 4: Literature Review & Technology Gap**

| Parameter | Traditional CI/CD (Jenkins UI) | Source Control (GitHub) | APM Tools (Grafana / Datadog) | **Our Platform** |
|---|---|---|---|---|
| **Git Management** | Plugin Dependent | Native | No | **Native Live API v3** |
| **Build Control** | Native | No | No | **Live REST Build Trigger** |
| **MLOps Model Tracking** | No | No | No | **Native ML Matrix** |
| **Infrastructure Telemetry** | No | No | High Cost | **Built-in Real-time Stream** |
| **Local Proxy Routing** | No | No | N/A | **Built-in Vite Proxy** |

**Identified Tech Gap:** Existing platforms are either purely traditional CI/CD tools or standalone monitoring suites. None offer a lightweight, unified interface bridging live Git repositories, live Jenkins build control, and real-time MLOps model telemetry.

---

### **SLIDE 5: System Architecture**

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Browser :5173)                      │
│     React 18 + TypeScript UI  │  Recharts Real-Time Telemetry Stream   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    PROXY & GATEWAY LAYER (Vite Proxy)                  │
│       Vite Reverse Proxy (/jenkins-proxy)  ──► Localhost / ngrok       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                       INTEGRATIONS & STORAGE                           │
│  GitHub REST API v3  │  Jenkins CI/CD Server  │  Supabase PostgreSQL DB  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### **SLIDE 6: Software & Hardware Requirements**

#### **Software Stack:**
- **Frontend:** React v18.3.1, TypeScript v5.5.3, Vite v5.4.8, Tailwind CSS v3.4.1
- **Visualization:** Recharts v3.10.0, Lucide Vector Icons
- **Backend & Database:** Supabase (PostgreSQL BaaS)
- **CI/CD & Automation:** Jenkins CI/CD v2.528.1, Git, GitHub REST API v3

#### **Hardware Specs:**
- **Processor:** Intel Core i5 / AMD Ryzen 5 (8th Gen+)
- **Memory:** 8 GB RAM minimum (16 GB recommended)
- **Disk:** 10 GB free SSD storage

---

### **SLIDE 7: Core Modules & Live Features**

1. **GitHub Live Integration:**
   - Personal Access Token (PAT) authentication.
   - Live repository listing, commit log inspector, branch architecture, and remote repo creation.

2. **Jenkins Live Control:**
   - Real-time server status detection (`Live · v2.528.1`).
   - Pipeline listing (`Maven-Build-Job`, `Skill 7`), **Build Now** execution, and live console log viewer.

3. **Telemetry & Performance Monitoring:**
   - Real-time 2.5s telemetry streams for CPU, RAM, and Latency.
   - Microservice health matrix tracking system components.

4. **Modular Code Architecture:**
   - Segregated `/frontend` (React UI) and `/backend` (Database schemas & SQL migrations).

---

### **SLIDE 8: Team Task Distribution**

| Member Name | Assigned Role | Key Responsibilities |
|---|---|---|
| **Boddiga Sai Krishna** | Team Lead & Full-Stack Architect | System Architecture, Vite Reverse Proxy, GitHub & Jenkins REST API Integration |
| **Member 2** | UI/UX & Frontend Developer | React Component Architecture, Tailwind Glassmorphism Theme, Recharts Charts |
| **Member 3** | MLOps & Database Specialist | Supabase PostgreSQL Schema, ML Application Tracking, Telemetry Engine |
| **Member 4** | QA & Documentation Lead | CORS Security Audit, Unit Testing, Review PPT & Documentation |

---

### **SLIDE 9: Project Timeline & Roadmap**

- **Phase 1 (Aug 17–22, 2026):** Capstone Review-1 Initiation, Problem Definition, Architecture, Live GitHub & Jenkins Proxy. **(COMPLETED)**
- **Phase 2 (Sept 2026):** Docker Container Engine & Kubernetes Cluster Integration.
- **Phase 3 (Oct 2026):** AWS EC2/S3 Cloud Services & Automated ML Model Deployment Pipelines.
- **Phase 4 (Nov 2026):** Final System Audit, End-to-End Testing, Capstone Final Review & Deployment.

---

### **SLIDE 10: Current Working Status & Deliverables**

- ✅ **GitHub Live REST Integration:** Fully Operational
- ✅ **Jenkins Live Build Trigger:** Fully Operational via Vite Proxy (`http://localhost:8080`)
- ✅ **Infrastructure Telemetry:** Real-Time Stream Functional
- ✅ **Folder Structure:** Modular Segregation (`/frontend` & `/backend`)
- ✅ **GitHub Repository:** Pushed & Synchronized at `BoddigaSaikrishna/Capstone-Project`

---

## 🎯 Presentation Tips for Review–1
1. **Open Live App:** Keep `http://localhost:5173/` running during your presentation.
2. **Demo Jenkins Build:** Click **"Build Now"** on `Skill 7` pipeline in the Jenkins page to demonstrate real-time integration to the examiners.
3. **Show GitHub Repo:** Point out that all code is committed and pushed to GitHub.
