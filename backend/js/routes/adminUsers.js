// ============================================================
// Headstart Education — Admin User Management
// GET    /api/admin-users       — list admin accounts (no password hashes)
// POST   /api/admin-users       — create a new admin account
// DELETE /api/admin-users/:id   — remove an admin account
// All routes require an existing superadmin session.
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { hashPassword, requireSuperAdmin } = require('../lib/auth');

router.use(requireSuperAdmin);

router.get('/', async (req, res) => {
  try {
    if (db.isConnected()) {
      const result = await db.query(
        'SELECT id, username, name, role, created_at FROM admin_users ORDER BY created_at ASC'
      );
      return res.json(result.rows);
    }
    res.json(db.mem.adminUsers.map(({ password_hash, ...safe }) => safe));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { username, password, name, role } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const safeUsername = String(username).trim().toLowerCase();
  const safeRole = role === 'superadmin' ? 'superadmin' : 'admin';
  try {
    const hash = await hashPassword(password);
    if (db.isConnected()) {
      const existing = await db.query('SELECT id FROM admin_users WHERE username=$1', [safeUsername]);
      if (existing.rows.length) return res.status(409).json({ message: 'That username already exists' });
      const result = await db.query(
        `INSERT INTO admin_users (username, password_hash, name, role) VALUES ($1,$2,$3,$4)
         RETURNING id, username, name, role, created_at`,
        [safeUsername, hash, name || safeUsername, safeRole]
      );
      return res.status(201).json(result.rows[0]);
    }
    if (db.mem.adminUsers.find((a) => a.username === safeUsername)) {
      return res.status(409).json({ message: 'That username already exists' });
    }
    const admin = {
      id: db.newId(), username: safeUsername, password_hash: hash,
      name: name || safeUsername, role: safeRole, created_at: new Date(),
    };
    db.mem.adminUsers.push(admin);
    const { password_hash, ...safe } = admin;
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  // Don't allow an admin to delete their own account from under themselves.
  if (req.admin.id === req.params.id) {
    return res.status(400).json({ message: "You can't delete your own account while logged in as it." });
  }
  try {
    if (db.isConnected()) {
      await db.query('DELETE FROM admin_users WHERE id=$1', [req.params.id]);
      return res.json({ success: true });
    }
    const i = db.mem.adminUsers.findIndex((a) => a.id === req.params.id);
    if (i !== -1) db.mem.adminUsers.splice(i, 1);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
