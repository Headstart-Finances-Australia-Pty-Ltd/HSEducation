// ============================================================
// Headstart Education — Contacts (members & partners)
// GET    /api/contacts?type=member|partner|donor|other
// POST   /api/contacts            — add one
// POST   /api/contacts/import     — add many { rows: [{name,email,organisation,type}] }
// PATCH  /api/contacts/:id        — edit / (un)subscribe
// DELETE /api/contacts/:id
// Admin or super admin only.
// ============================================================
const express  = require('express');
const router   = express.Router();
const contacts = require('../lib/contacts');
const { requireAdmin } = require('../lib/auth');
const { logAudit } = require('./adminAuth');

router.use(requireAdmin);
const fail = (res, err) => res.status(err.status || 500).json({ message: err.message });

router.get('/', async (req, res) => {
  try { res.json(await contacts.list(req.query.type || null)); } catch (err) { fail(res, err); }
});

router.post('/', async (req, res) => {
  try {
    const row = await contacts.create(req.body || {});
    await logAudit(req.admin, 'contact.create', row.email);
    res.status(201).json(row);
  } catch (err) { fail(res, err); }
});

router.post('/import', async (req, res) => {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows.slice(0, 1000) : [];
    if (!rows.length) return res.status(400).json({ message: 'No rows to import.' });
    let added = 0; const skipped = [];
    for (const r of rows) {
      try { await contacts.create({ ...r, type: r.type || 'member' }); added++; }
      catch (err) { skipped.push(`${r.email || '(blank)'}: ${err.message}`); }
    }
    await logAudit(req.admin, 'contact.import', `${added} added, ${skipped.length} skipped`);
    res.json({ added, skipped });
  } catch (err) { fail(res, err); }
});

router.patch('/:id', async (req, res) => {
  try {
    const row = await contacts.update(req.params.id, req.body || {});
    if (!row) return res.status(404).json({ message: 'Contact not found' });
    res.json(row);
  } catch (err) { fail(res, err.code === '22P02' ? { status: 404, message: 'Contact not found' } : err); }
});

router.delete('/:id', async (req, res) => {
  try {
    const ok = await contacts.remove(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Contact not found' });
    await logAudit(req.admin, 'contact.delete', req.params.id);
    res.json({ message: 'Removed' });
  } catch (err) { fail(res, err.code === '22P02' ? { status: 404, message: 'Contact not found' } : err); }
});

module.exports = router;
