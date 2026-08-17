# Project Abstract

## Title: DevOps & MLOps Orchestration Pipeline Dashboard
**Author / Team Lead:** Boddiga Sai Krishna  
**Domain:** DevOps Engineering, MLOps, Cloud Infrastructure & Full-Stack Web Systems  

---

### **Abstract**

In contemporary software engineering and artificial intelligence workflows, managing continuous integration (CI), continuous delivery (CD), cloud infrastructure, and machine learning (ML) model training lifecycle requires operating across multiple disparate, siloed administration consoles. This fragmentation imposes significant cognitive overhead on engineering teams, delays incident response, and obscures real-time system observability.

To address these operational inefficiencies, this project presents the **DevOps & MLOps Orchestration Pipeline Dashboard**—a unified, high-performance single-tenant control center engineered to consolidate traditional software development operations with machine learning lifecycle management. Developed using **React 18, TypeScript, Vite, and Tailwind CSS**, the platform provides a centralized, dark-themed operational workspace featuring live API integrations, real-time infrastructure telemetry, and interactive pipeline management.

Key architectural innovations of the platform include:
1. **Live GitHub REST API v3 Integration**: Enables real-time repository tracking, commit history inspection, branch architecture navigation, and direct remote repository provisioning via personal access token (PAT) authentication.
2. **CORS-Bypassed Jenkins CI/CD Orchestration**: Solves cross-origin resource sharing (CORS) constraints inherent in local automation servers by establishing a **Vite reverse proxy server** (`/jenkins-proxy`) coupled with encrypted **ngrok tunneling**. This mechanism allows full remote triggering of Jenkins build pipelines and real-time streaming of console logs directly within the browser console interface.
3. **Real-Time Telemetry & Monitoring Engine**: Renders interactive telemetry data using **Recharts**, streaming CPU utilization, memory consumption, and API response latency at 2.5-second refresh intervals, accompanied by a microservice health matrix across system components.
4. **MLOps Model Lifecycle Tracking**: Integrates with a **Supabase PostgreSQL** database backend to persist machine learning model versions, framework configurations, training accuracy metrics, and deployment endpoints.

By bridging the gap between traditional software CI/CD pipelines and machine learning operations within a single unified dashboard, this project significantly reduces operational context-switching, streamlines build execution, and provides real-time system visibility for modern software and MLOps engineers.

---

### **Keywords**
`DevOps`, `MLOps`, `React 18`, `TypeScript`, `Jenkins CI/CD`, `GitHub REST API`, `Vite Reverse Proxy`, `Infrastructure Monitoring`, `Supabase PostgreSQL`, `Real-Time Telemetry`.
