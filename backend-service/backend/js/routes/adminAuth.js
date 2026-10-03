// ============================================================
// Headstart Education — Admin Auth Routes
// POST /api/admin-auth/login            — verify credentials, set session cookie
// POST /api/admin-auth/logout           — clear session cookie
// GET  /api/admin-auth/me               — who's currently logged in (session check)
// POST /api/admin-auth/change-password  — any logged-in user changes their own password
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const users   = require('../lib/users');
const {
  comparePassword,
  hashPassword,
  signAdminToken,
  requireAuth,
  ADMIN_COOKIE_NAME,
  COOKIE_OPTIONS,
} = require('../lib/auth');

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
    const user = await users.findByUsername(String(username).trim().toLowerCase());
    if (!user) return res.status(401).json({ message: 'Invalid username or password' });

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid username or password' });

    // Checked after the password so a disabled account doesn't reveal itself to guessers.
    if (!user.is_active) {
      return res.status(403).json({ message: 'This account has been disabled. Contact a super admin.' });
    }

    const safeAdmin = { id: user.id, username: user.username, name: user.name, role: user.role };
    const token = signAdminToken(safeAdmin);
    res.cookie(ADMIN_COOKIE_NAME, token, COOKIE_OPTIONS);
    await users.touchLogin(user.id);
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

router.get('/me', requireAuth, async (req, res) => {
  // requireAuth already loaded the live user; return the safe fields.
  res.json(req.admin);
});

router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    const user = await users.findById(req.admin.id);
    if (!user || !(await comparePassword(currentPassword, user.password_hash))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    await users.update(user.id, { password_hash: await hashPassword(newPassword) });
    await logAudit(req.admin, 'user.change_password', null);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('CHANGE PASSWORD ERROR:', err);
    res.status(500).json({ message: 'Could not change password' });
  }
});

module.exports = { router, logAudit };
