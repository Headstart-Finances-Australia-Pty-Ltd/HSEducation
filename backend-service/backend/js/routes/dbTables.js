// ============================================================
// Headstart Education — Database Tables Admin Routes
// Same pattern as Kutumb's dbTables.routes.js: a generic, safe
// browser/editor over the real Postgres tables, for the Admin
// Console's "Database Tables" tab. Super admin only.
//
// GET    /api/db-tables/tables              — list browsable table names
// GET    /api/db-tables/tables/:table       — columns + rows (capped 500)
// POST   /api/db-tables/tables/:table       — insert a row
// PUT    /api/db-tables/tables/:table/:pk   — update a row
// DELETE /api/db-tables/tables/:table/:pk   — delete a row
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireSuperAdmin } = require('../lib/auth');
const { logAudit } = require('./adminAuth');

router.use(requireSuperAdmin);

// users / admin_users / app_settings are deliberately excluded from this
// generic editor: they have dedicated UIs (the Users and Square Settings
// tabs), and a generic editor would
// let someone paste a plaintext password straight into password_hash,
// silently creating a broken/insecure login (or expose stored secrets).
const EXCLUDED_TABLES = ['admin_users', 'users', 'app_settings'];

function requireDb(req, res, next) {
  if (!db.isConnected()) {
    return res.status(503).json({
      message: 'No database connected. Set DATABASE_URL in backend/js/.env (your Neon connection string) and restart the server — see README.',
    });
  }
  next();
}
router.use(requireDb);

async function getAllowedTables() {
  const { rows } = await db.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`
  );
  return rows.map((r) => r.table_name).filter((t) => !EXCLUDED_TABLES.includes(t));
}

async function assertAllowedTable(tableName) {
  const allowed = await getAllowedTables();
  if (!allowed.includes(tableName)) {
    const err = new Error('Unknown or restricted table');
    err.statusCode = 400;
    throw err;
  }
}

async function getColumns(tableName) {
  const { rows } = await db.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [tableName]
  );
  return rows;
}

// Every table here uses `id` as its primary key (UUID or SERIAL) — no
// per-table override needed, unlike Kutumb's key-settings table.
const PRIMARY_KEY = 'id';

router.get('/tables', async (req, res) => {
  try {
    res.json(await getAllowedTables());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/tables/:table', async (req, res) => {
  try {
    await assertAllowedTable(req.params.table);
    const columns = await getColumns(req.params.table);

    // Capped at 500 rows — this is an admin data-browser, not a reporting
    // tool. Search/filter/sort beyond that happens client-side over this
    // page, same as Kutumb's equivalent screen.
    const { rows } = await db.query(
      `SELECT * FROM "${req.params.table}" ORDER BY "${PRIMARY_KEY}" DESC LIMIT 500`
    );

    res.json({ columns, rows, primaryKey: PRIMARY_KEY, truncated: rows.length === 500 });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
});

router.post('/tables/:table', async (req, res) => {
  try {
    await assertAllowedTable(req.params.table);
    const columns = await getColumns(req.params.table);
    const columnNames = columns.map((c) => c.column_name);

    const entries = Object.entries(req.body || {}).filter(
      ([key, value]) => columnNames.includes(key) && value !== '' && value !== undefined
    );
    if (entries.length === 0) return res.status(400).json({ message: 'No valid column values provided' });

    const cols = entries.map(([key]) => `"${key}"`).join(', ');
    const placeholders = entries.map((_, i) => `$${i + 1}`).join(', ');
    const values = entries.map(([, value]) => value);

    const { rows } = await db.query(
      `INSERT INTO "${req.params.table}" (${cols}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    await logAudit(req.admin, 'db_table.insert', JSON.stringify({ table: req.params.table, row: rows[0] }));
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
});

router.put('/tables/:table/:pkValue', async (req, res) => {
  try {
    await assertAllowedTable(req.params.table);
    const columns = await getColumns(req.params.table);
    const columnNames = columns.map((c) => c.column_name);

    const entries = Object.entries(req.body || {}).filter(
      ([key, value]) => columnNames.includes(key) && key !== PRIMARY_KEY && value !== undefined
    );
    if (entries.length === 0) return res.status(400).json({ message: 'No valid column values provided' });

    const setClause = entries.map(([key], i) => `"${key}" = $${i + 1}`).join(', ');
    const values = entries.map(([, value]) => value);
    values.push(req.params.pkValue);

    const { rows } = await db.query(
      `UPDATE "${req.params.table}" SET ${setClause} WHERE "${PRIMARY_KEY}" = $${values.length} RETURNING *`,
      values
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Row not found' });

    await logAudit(req.admin, 'db_table.update', JSON.stringify({ table: req.params.table, pk: req.params.pkValue }));
    res.json(rows[0]);
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
});

router.delete('/tables/:table/:pkValue', async (req, res) => {
  try {
    await assertAllowedTable(req.params.table);

    const { rows } = await db.query(
      `DELETE FROM "${req.params.table}" WHERE "${PRIMARY_KEY}" = $1 RETURNING *`,
      [req.params.pkValue]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Row not found' });

    await logAudit(req.admin, 'db_table.delete', JSON.stringify({ table: req.params.table, pk: req.params.pkValue }));
    res.json({ message: 'Row deleted' });
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
});

module.exports = router;
