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
const { requireEditor } = require('../lib/auth');
const images  = require('../lib/images');

const CATEGORIES = ['Scholarships', 'Literacy', 'Indigenous', 'Vocational', 'Infrastructure', 'General'];
const STATUSES   = ['active', 'completed', 'paused', 'fundraising'];

// A project's uploaded picture is stored as a library image: /api/images/lib_xxxxxxxxxx
const libKey = (url) => { const m = /\/api\/images\/(lib_[a-f0-9]{10})(?:[?#].*)?$/.exec(String(url || '')); return m ? m[1] : null; };
const dropImage = async (url) => { const k = libKey(url); if (k) { try { await images.remove(k); } catch (e) { /* already gone */ } } };
const num = (v, d = 0) => { const n = parseFloat(v); return Number.isFinite(n) && n >= 0 ? n : d; };

async function findProgram(id) {
  if (db.isConnected()) {
    try { const r = await db.query('SELECT * FROM programs WHERE id=$1', [id]); return r.rows[0] || null; }
    catch (e) { if (e.code === '22P02') return null; throw e; }   // not a valid UUID
  }
  return db.mem.programs.find((x) => x.id === id) || null;
}

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
router.post('/', requireEditor, async (req, res) => {
  const { name, category, description, location, goal_amount, status, image_url } = req.body;
  if (!name || !String(name).trim() || !category) return res.status(400).json({ error: 'name and category are required' });
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Unknown category' });
  if (status && !STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status' });
  try {
    if (db.isConnected()) {
      const result = await db.query(
        `INSERT INTO programs (name,category,description,location,goal_amount,raised_amount,status,image_url)
         VALUES ($1,$2,$3,$4,$5,0,$6,$7) RETURNING *`,
        [name, category, description||'', location||'', num(goal_amount), status||'active', image_url||null]
      );
      return res.status(201).json(result.rows[0]);
    }
    const p = { id: db.newId(), name, category, description:description||'', location:location||'',
      goal_amount: num(goal_amount), raised_amount:0,
      status: status||'active', image_url: image_url||null, created_at: new Date() };
    db.mem.programs.push(p);
    res.status(201).json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/programs/:id  — only the fields sent are changed
router.put('/:id', requireEditor, async (req, res) => {
  try {
    const cur = await findProgram(req.params.id);
    if (!cur) return res.status(404).json({ error: 'Not found' });
    const b = req.body || {};
    const has = (k) => Object.prototype.hasOwnProperty.call(b, k);
    const next = {
      name:          has('name') ? String(b.name || '').trim() : cur.name,
      category:      has('category') ? b.category : cur.category,
      description:   has('description') ? String(b.description || '') : cur.description,
      location:      has('location') ? String(b.location || '') : cur.location,
      goal_amount:   has('goal_amount') ? num(b.goal_amount) : Number(cur.goal_amount),
      raised_amount: has('raised_amount') ? num(b.raised_amount) : Number(cur.raised_amount),
      status:        has('status') ? b.status : cur.status,
      image_url:     has('image_url') ? (b.image_url || null) : cur.image_url,
    };
    if (!next.name) return res.status(400).json({ error: 'Name is required' });
    if (!CATEGORIES.includes(next.category)) return res.status(400).json({ error: 'Unknown category' });
    if (!STATUSES.includes(next.status)) return res.status(400).json({ error: 'Unknown status' });

    let saved;
    if (db.isConnected()) {
      const result = await db.query(
        `UPDATE programs SET name=$1,category=$2,description=$3,location=$4,
         goal_amount=$5,raised_amount=$6,status=$7,image_url=$8,updated_at=NOW()
         WHERE id=$9 RETURNING *`,
        [next.name, next.category, next.description, next.location, next.goal_amount, next.raised_amount, next.status, next.image_url, req.params.id]);
      saved = result.rows[0];
    } else {
      const i = db.mem.programs.findIndex((x) => x.id === req.params.id);
      db.mem.programs[i] = { ...db.mem.programs[i], ...next };
      saved = db.mem.programs[i];
    }
    // The picture was replaced or removed — erase the old uploaded file.
    if (cur.image_url && cur.image_url !== next.image_url) await dropImage(cur.image_url);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/programs/:id  — also erases the project's uploaded picture
router.delete('/:id', requireEditor, async (req, res) => {
  try {
    const cur = await findProgram(req.params.id);
    if (!cur) return res.status(404).json({ error: 'Not found' });
    if (db.isConnected()) {
      await db.query('DELETE FROM programs WHERE id=$1', [req.params.id]);
    } else {
      const i = db.mem.programs.findIndex((x) => x.id === req.params.id);
      if (i !== -1) db.mem.programs.splice(i, 1);
    }
    await dropImage(cur.image_url);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
