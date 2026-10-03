// ============================================================
// Headstart Education — Website contact form
// POST   /api/contact-messages   — public: "Send Us a Message" form
// GET    /api/contact-messages   — admin: list received messages
// DELETE /api/contact-messages/:id — admin
// Every message is saved first, then emailed to the team (Admin Console →
// API Key Settings → Email → "admin notify" address). If email isn't set up
// the message is still stored and visible under Database Tables.
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const mailer  = require('../lib/mailer');
const { requireAdmin } = require('../lib/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v, max) => String(v ?? '').trim().slice(0, max);

// Light in-memory throttle: 5 messages / 10 min per IP (spam guard).
const hits = new Map();
function throttled(ip) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  if (list.length >= 5) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list);
  return false;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 600000)) hits.delete(k); }, 600000).unref();

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    // Honeypot: real visitors never fill this hidden field. Pretend success.
    if (b.hs_trap_field) { console.log('Contact form: spam trap field filled — message discarded.'); return res.status(201).json({ message: 'Message sent' }); }

    const ip = String(req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    if (throttled(ip)) return res.status(429).json({ message: 'Too many messages sent. Please try again in a few minutes.' });

    const name = clean(b.name, 150), email = clean(b.email, 255).toLowerCase();
    const organisation = clean(b.organisation, 200) || null, message = clean(b.message, 5000);
    if (!name) return res.status(400).json({ message: 'Please enter your name.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please enter a valid email address.' });
    if (message.length < 3) return res.status(400).json({ message: 'Please enter a message.' });

    let row;
    if (db.isConnected()) {
      const { rows } = await db.query(
        'INSERT INTO contact_messages (name,email,organisation,message) VALUES ($1,$2,$3,$4) RETURNING *',
        [name, email, organisation, message]);
      row = rows[0];
    } else {
      if (!db.mem.contact_messages) db.mem.contact_messages = [];
      row = { id: db.newId(), name, email, organisation, message, email_sent: false, created_at: new Date() };
      db.mem.contact_messages.push(row);
    }

    const result = await mailer.sendContactMessage(row);
    const errText = result.sent ? null : String(result.error || 'Unknown error').slice(0, 500);
    if (db.isConnected()) {
      db.query('UPDATE contact_messages SET email_sent = $2, email_error = $3 WHERE id = $1', [row.id, !!result.sent, errText])
        .catch((e) => console.warn('Could not record email result:', e.message));
    } else { row.email_sent = !!result.sent; row.email_error = errText; }
    res.status(201).json({ message: 'Message sent' });
  } catch (err) {
    console.error('Contact form error:', err.message);
    res.status(500).json({ message: 'Sorry, we could not send your message right now. Please email info@hseducation.org instead.' });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    if (db.isConnected()) {
      const { rows } = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 500');
      return res.json(rows);
    }
    res.json((db.mem.contact_messages || []).slice().reverse());
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (db.isConnected()) {
      const { rowCount } = await db.query('DELETE FROM contact_messages WHERE id = $1', [req.params.id]);
      return rowCount ? res.json({ message: 'Removed' }) : res.status(404).json({ message: 'Not found' });
    }
    const list = db.mem.contact_messages || [];
    const i = list.findIndex((m) => m.id === req.params.id);
    if (i < 0) return res.status(404).json({ message: 'Not found' });
    list.splice(i, 1); res.json({ message: 'Removed' });
  } catch (err) { res.status(err.code === '22P02' ? 404 : 500).json({ message: err.code === '22P02' ? 'Not found' : err.message }); }
});

module.exports = router;
