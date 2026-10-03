-- ============================================================
-- Headstart Education — Seed Data
-- File: 02_seed.sql
-- Run AFTER 01_schema.sql
-- ============================================================

-- ── Providers ─────────────────────────────────────────────
INSERT INTO providers (name, type, config_public, is_active) VALUES
  ('Square',                 'square', NULL, true),
  ('Manual / Bank Transfer', 'manual', NULL, true);

-- ── Programs ──────────────────────────────────────────────
-- We are a newly established charity — this is our first project,
-- currently in development (not yet launched). See the business plan /
-- Impact page for how we report on progress as it happens.
INSERT INTO programs (name, category, description, location, goal_amount, raised_amount, status) VALUES
  (
    'First Project — Rural School, Uttar Pradesh',
    'Infrastructure',
    'Our first project is currently in development. We have identified a school in a rural village in Uttar Pradesh where there is a need for additional classroom infrastructure and learning resources. We are currently completing the groundwork required to begin supporting the school.',
    'Uttar Pradesh, India',
    0.00, 0.00, 'fundraising'
  );

-- No sample donations are seeded — as a newly established charity we have
-- no donation history yet. Donations will appear here as they are made
-- through the live Square-powered Donate page.
