-- ============================================================
-- Headstart Education — PostgreSQL Schema (Neon-ready)
-- File: 01_schema.sql
-- Applied automatically by `npm run migrate` (backend/js/migrate.js),
-- which runs on every app.cmd launch — so this file is written to be
-- safe to run over and over: every statement is IF NOT EXISTS / OR
-- REPLACE, and nothing here ever DROPs a table or deletes data.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────
-- TABLE: admin_users
-- LEGACY — superseded by the `users` table below. Kept (never dropped) so
-- existing data is safe; its rows are copied into `users` automatically.
-- The first row is created automatically on startup — see bootstrapAdmin.js
-- and ADMIN_USERNAME / ADMIN_PASSWORD in backend/js/.env
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  username       VARCHAR(100) UNIQUE NOT NULL,
  password_hash  TEXT         NOT NULL,
  name           VARCHAR(100) NOT NULL,
  role           VARCHAR(20)  NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','superadmin')),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────
-- TABLE: users
-- Everyone who can log in to the Admin Console — super admins, admins
-- and other staff. Replaces the old admin_users table (rows are copied
-- across below, keeping the same ids, so existing logins keep working).
-- Roles:
--   superadmin — everything, incl. Users, Square Settings, Database Tables
--   admin      — donations (view + update status) and projects
--   editor     — view donations, create/edit/delete projects
--   viewer     — read-only access to donations and projects
-- Passwords are bcrypt-hashed (see backend/js/lib/auth.js).
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  username       VARCHAR(100) UNIQUE NOT NULL,
  email          VARCHAR(255),
  password_hash  TEXT         NOT NULL,
  name           VARCHAR(100) NOT NULL,
  role           VARCHAR(20)  NOT NULL DEFAULT 'viewer'
                   CHECK (role IN ('superadmin','admin','editor','viewer')),
  is_active      BOOLEAN      NOT NULL DEFAULT true,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- One-off, idempotent copy of legacy admin accounts (same ids, so any
-- existing session keeps working). Does nothing once they're copied.
INSERT INTO users (id, username, password_hash, name, role, created_at)
SELECT id, username, password_hash, name, role, created_at FROM admin_users
ON CONFLICT (username) DO NOTHING;

-- ─────────────────────────────────────────────────────────
-- TABLE: app_settings
-- Key/value settings managed from the Admin Console (currently the
-- Square credentials, keys prefixed "square."). Secret values are
-- AES-256-GCM encrypted by the app before they are stored — see
-- backend/js/lib/settings.js.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT,
  is_secret   BOOLEAN      NOT NULL DEFAULT false,
  updated_by  VARCHAR(100),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- TABLE: site_images
-- The website's photos, stored as bytes so they survive redeploys and can
-- be replaced from Admin Console → Images. `key` matches the slot names in
-- backend/js/lib/imageCatalog.js (which also documents where each is used).
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_images (
  key         VARCHAR(60)  PRIMARY KEY,
  label       VARCHAR(150) NOT NULL,
  purpose     TEXT,
  mime_type   VARCHAR(50)  NOT NULL,
  data        BYTEA        NOT NULL,
  size_bytes  INTEGER      NOT NULL,
  is_custom   BOOLEAN      NOT NULL DEFAULT false,
  updated_by  VARCHAR(100),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- TABLE: admin_audit_log
-- Records admin logins and sensitive actions for accountability.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id              SERIAL       PRIMARY KEY,
  admin_username  VARCHAR(100),
  action          VARCHAR(100) NOT NULL,   -- e.g. 'admin.login', 'program.update'
  details         TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

-- ─────────────────────────────────────────────────────────
-- TABLE: providers
-- Stores donation payment providers (Square, manual, etc.)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS providers (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(100) NOT NULL,
  type           VARCHAR(50)  NOT NULL CHECK (type IN ('square','stripe','paypal','eway','securepay','manual')),
  config_public  TEXT,                          -- public key / client id (safe to log)
  config_secret  TEXT,                          -- secret key (never returned in API GET)
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  providers IS 'Payment gateway providers used to process donations';
COMMENT ON COLUMN providers.config_secret IS 'Encrypted secret key — never expose in API responses';

-- ─────────────────────────────────────────────────────────
-- TABLE: programs
-- Educational programs and projects receiving donations
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programs (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(200) NOT NULL,
  category       VARCHAR(50)  NOT NULL CHECK (category IN (
                   'Scholarships','Literacy','Indigenous','Vocational','Infrastructure','General'
                 )),
  description    TEXT,
  location       VARCHAR(200),
  goal_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  raised_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  status         VARCHAR(20)  NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','completed','paused','fundraising')),
  image_url      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE programs IS 'Educational programs and projects that donations are allocated to';

-- ─────────────────────────────────────────────────────────
-- TABLE: donations
-- Records every donation made to Headstart Education
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100),
  email          VARCHAR(255) NOT NULL,
  phone          VARCHAR(30),
  amount         NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  frequency      VARCHAR(20)  NOT NULL DEFAULT 'once'
                   CHECK (frequency IN ('once','monthly','annually')),
  program_id     UUID         REFERENCES programs(id)  ON DELETE SET NULL,
  provider_id    UUID         REFERENCES providers(id) ON DELETE SET NULL,
  transaction_id VARCHAR(200),                 -- ID returned by payment gateway
  status         VARCHAR(20)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','completed','failed','refunded')),
  is_tax_receipt_sent BOOLEAN NOT NULL DEFAULT false,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  donations IS 'All donations received by Headstart Education';
COMMENT ON COLUMN donations.transaction_id IS 'Payment gateway transaction reference for reconciliation';

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_donations_email      ON donations(email);
CREATE INDEX IF NOT EXISTS idx_donations_status     ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created    ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_program    ON donations(program_id);
CREATE INDEX IF NOT EXISTS idx_programs_category    ON programs(category);
CREATE INDEX IF NOT EXISTS idx_programs_status      ON programs(status);

-- ── updated_at auto-trigger ──────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- CREATE OR REPLACE TRIGGER requires Postgres 14+ (Neon runs a current
-- version, so this is safe) — lets this file be re-run without an error
-- on "trigger already exists", unlike plain CREATE TRIGGER.
CREATE OR REPLACE TRIGGER trg_donations_updated  BEFORE UPDATE ON donations  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_programs_updated   BEFORE UPDATE ON programs   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_providers_updated  BEFORE UPDATE ON providers  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER trg_users_updated      BEFORE UPDATE ON users      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
