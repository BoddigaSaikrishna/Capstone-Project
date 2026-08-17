# Backend Architecture & Database Services

This directory contains the database migration scripts, API proxy schemas, and backend configurations for the **DevOps & MLOps Orchestration Pipeline**.

---

### **Directory Overview**

```
backend/
└── supabase/
    └── migrations/
        └── 20260723043019_create_ml_applications_table.sql
```

---

### **Services & Integrations**

1. **Supabase PostgreSQL Database**:
   - Manages persistence for ML Applications, model framework details, versioning, accuracy scores, and deployment endpoints.
   - Run migrations via Supabase CLI or apply directly in the Supabase SQL Editor.

2. **Reverse Proxy & Tunneling**:
   - The frontend Vite server acts as a CORS proxy (`/jenkins-proxy`) forwarding API requests to local Jenkins instances over ngrok tunnels.

3. **External REST API Connectors**:
   - **GitHub REST API v3**: Authenticated via Personal Access Token (`VITE_GITHUB_TOKEN`).
   - **Jenkins REST API**: Authenticated via Basic Auth + CSRF Crumb Header over `/jenkins-proxy`.
