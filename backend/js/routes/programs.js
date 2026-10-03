// ============================================================
// Headstart Education — Programs Routes
// Works with PostgreSQL or in-memory fallback automatically
// GET    /api/programs         — list all programs
// GET    /api/programs/:id     — single program
// POST   /api/programs         — create
// PUT    /api/programs/:id     — update
// DELETE /api/programs/:id     — delete
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAdmin } = require('../lib/auth');

// GET /api/programs
router.get('/', async (req, res) => {
  try {
    const { category, status } = req.query;
    if (db.isConnected()) {
      let sql = 'SELECT * FROM programs WHERE 1=1';
      const params = [];
      if (category) { params.push(category); sql += ` AND category=$${params.length}`; }
      if (status)   { params.push(status);   sql += ` AND status=$${params.length}`; }
      sql += ' ORDER BY created_at DESC';
      const result = await db.query(sql, params);
      return res.json(result.rows);
    }
    let list = db.mem.programs;
    if (category) list = list.filter(p => p.category === category);
    if (status)   list = list.filter(p => p.status   === status);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/programs/:id
router.get('/:id', async (req, res) => {
  try {
    if (db.isConnected()) {
      const result = await db.query('SELECT * FROM programs WHERE id=$1', [req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      return res.json(result.rows[0]);
    }
    const p = db.mem.programs.find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/programs
router.post('/', requireAdmin, async (req, res) => {
  const { name, category, description, location, goal_amount, status, image_url } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name and category are required' });
  try {
    if (db.isConnected()) {
      const result = await db.query(
        `INSERT INTO programs (name,category,description,location,goal_amount,raised_amount,status,image_url)
         VALUES ($1,$2,$3,$4,$5,0,$6,$7) RETURNING *`,
        [name, category, description||'', location||'', parseFloat(goal_amount||0), status||'active', image_url||null]
      );
      return res.status(201).json(result.rows[0]);
    }
    const p = { id: db.newId(), name, category, description:description||'', location:location||'',
      goal_amount: parseFloat(goal_amount||0), raised_amount:0,
      status: status||'active', image_url: image_url||null, created_at: new Date() };
    db.mem.programs.push(p);
    res.status(201).json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/programs/:id
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, category, description, location, goal_amount, raised_amount, status, image_url } = req.body;
  try {
    if (db.isConnected()) {
      const result = await db.query(
        `UPDATE programs SET name=$1,category=$2,description=$3,location=$4,
         goal_amount=$5,raised_amount=$6,status=$7,image_url=$8,updated_at=NOW()
         WHERE id=$9 RETURNING *`,
        [name, category, description, location,
         parseFloat(goal_amount), parseFloat(raised_amount), status, image_url, req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      return res.json(result.rows[0]);
    }
    const i = db.mem.programs.findIndex(x => x.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Not found' });
    db.mem.programs[i] = { ...db.mem.programs[i], name, category, description, location,
      goal_amount: parseFloat(goal_amount), raised_amount: parseFloat(raised_amount), status, image_url };
    res.json(db.mem.programs[i]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/programs/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (db.isConnected()) {
      await db.query('DELETE FROM programs WHERE id=$1', [req.params.id]);
      return res.json({ success: true });
    }
    const i = db.mem.programs.findIndex(x => x.id === req.params.id);
    if (i !== -1) db.mem.programs.splice(i, 1);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
