/*
# Create ml_applications table (single-tenant, no auth)

1. New Tables
- `ml_applications`
  - `id` (uuid, primary key)
  - `name` (text, not null) — application display name
  - `description` (text) — what the ML app does
  - `model_type` (text) — e.g. "ResNet-50", "XGBoost Classifier"
  - `framework` (text) — e.g. "PyTorch 2.1", "scikit-learn"
  - `version` (text) — deployed version tag
  - `accuracy` (numeric) — model accuracy percentage (0-100)
  - `endpoint` (text) — prediction endpoint path
  - `status` (text) — one of: success, running, failed, pending, idle, warning
  - `last_trained` (timestamptz) — when the model was last trained
  - `repository` (text) — GitHub repo full name
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on `ml_applications`.
- Allow anon + authenticated full CRUD — this is a single-tenant prototype dashboard
  with no sign-in screen, so the anon-key client must be able to read and write.
- `USING (true)` / `WITH CHECK (true)` is acceptable because all data is intentionally shared.
*/

CREATE TABLE IF NOT EXISTS ml_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  model_type text,
  framework text,
  version text,
  accuracy numeric DEFAULT 0,
  endpoint text,
  status text DEFAULT 'pending',
  last_trained timestamptz,
  repository text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ml_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ml_apps" ON ml_applications;
CREATE POLICY "anon_select_ml_apps" ON ml_applications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ml_apps" ON ml_applications;
CREATE POLICY "anon_insert_ml_apps" ON ml_applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ml_apps" ON ml_applications;
CREATE POLICY "anon_update_ml_apps" ON ml_applications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ml_apps" ON ml_applications;
CREATE POLICY "anon_delete_ml_apps" ON ml_applications FOR DELETE
  TO anon, authenticated USING (true);
