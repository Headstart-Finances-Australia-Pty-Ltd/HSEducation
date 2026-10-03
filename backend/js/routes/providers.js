// ============================================================
// Headstart Education — Providers Routes
// Works with PostgreSQL or in-memory fallback automatically
// GET    /api/providers        — list providers
// GET    /api/providers/:id    — single provider
// POST   /api/providers        — create
// PUT    /api/providers/:id    — update
// DELETE /api/providers/:id    — delete
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAdmin } = require('../lib/auth');

// GET /api/providers
router.get('/', async (req, res) => {
  try {
    if (db.isConnected()) {
      const result = await db.query('SELECT id,name,type,is_active,created_at FROM providers ORDER BY name');
      return res.json(result.rows);
    }
    res.json(db.mem.providers.map(({ config_secret, ...p }) => p));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/providers/:id
router.get('/:id', async (req, res) => {
  try {
    if (db.isConnected()) {
      const result = await db.query('SELECT id,name,type,is_active,created_at FROM providers WHERE id=$1', [req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      return res.json(result.rows[0]);
    }
    const p = db.mem.providers.find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    const { config_secret, ...safe } = p;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/providers
router.post('/', requireAdmin, async (req, res) => {
  const { name, type, config_public, config_secret, is_active } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
  try {
    if (db.isConnected()) {
      const result = await db.query(
        `INSERT INTO providers (name,type,config_public,config_secret,is_active)
         VALUES ($1,$2,$3,$4,$5) RETURNING id,name,type,is_active,created_at`,
        [name, type, config_public||null, config_secret||null, is_active !== false]
      );
      return res.status(201).json(result.rows[0]);
    }
    const p = { id: db.newId(), name, type, config_public: config_public||null,
      is_active: is_active !== false, created_at: new Date() };
    db.mem.providers.push(p);
    const { config_secret: _s, ...safe } = p;
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/providers/:id
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, type, config_public, config_secret, is_active } = req.body;
  try {
    if (db.isConnected()) {
      const result = await db.query(
        `UPDATE providers SET name=$1,type=$2,config_public=$3,config_secret=$4,
         is_active=$5,updated_at=NOW() WHERE id=$6
         RETURNING id,name,type,is_active,updated_at`,
        [name, type, config_public, config_secret, is_active, req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      return res.json(result.rows[0]);
    }
    const i = db.mem.providers.findIndex(x => x.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Not found' });
    db.mem.providers[i] = { ...db.mem.providers[i], name, type, config_public, is_active };
    res.json(db.mem.providers[i]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/providers/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (db.isConnected()) {
      await db.query('DELETE FROM providers WHERE id=$1', [req.params.id]);
      return res.json({ success: true });
    }
    const i = db.mem.providers.findIndex(x => x.id === req.params.id);
    if (i !== -1) db.mem.providers.splice(i, 1);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
