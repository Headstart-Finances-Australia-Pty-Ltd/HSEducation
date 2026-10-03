// ============================================================
// Headstart Education — Admin Auth Routes
// POST /api/admin-auth/login   — verify credentials, set session cookie
// POST /api/admin-auth/logout  — clear session cookie
// GET  /api/admin-auth/me      — who's currently logged in (session check)
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const {
  comparePassword,
  signAdminToken,
  requireAdmin,
  ADMIN_COOKIE_NAME,
  COOKIE_OPTIONS,
} = require('../lib/auth');

async function findAdminByUsername(username) {
  if (db.isConnected()) {
    const { rows } = await db.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    return rows[0] || null;
  }
  return db.mem.adminUsers.find((a) => a.username === username) || null;
}

async function logAudit(admin, action, details) {
  const entry = { admin_username: admin.username, action, details, created_at: new Date() };
  if (db.isConnected()) {
    try {
      await db.query(
        'INSERT INTO admin_audit_log (admin_username, action, details) VALUES ($1,$2,$3)',
        [admin.username, action, details || null]
      );
    } catch (err) {
      console.warn('Could not write audit log:', err.message);
    }
  } else {
    db.mem.auditLog.push(entry);
  }
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const admin = await findAdminByUsername(String(username).trim().toLowerCase());
    if (!admin) return res.status(401).json({ message: 'Invalid username or password' });

    const ok = await comparePassword(password, admin.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid username or password' });

    const safeAdmin = { id: admin.id, username: admin.username, name: admin.name, role: admin.role };
    const token = signAdminToken(safeAdmin);
    res.cookie(ADMIN_COOKIE_NAME, token, COOKIE_OPTIONS);
    await logAudit(safeAdmin, 'admin.login', null);
    // Also returned in the body for any non-browser API usage — the
    // browser itself relies on the cookie, not this value.
    res.json({ token, admin: safeAdmin });
  } catch (err) {
    console.error('ADMIN LOGIN ERROR:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: undefined });
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAdmin, async (req, res) => {
  const admin = await findAdminByUsername(req.admin.username);
  if (!admin) return res.status(404).json({ message: 'Admin not found' });
  res.json({ id: admin.id, username: admin.username, name: admin.name, role: admin.role });
});

module.exports = { router, logAudit, findAdminByUsername };
