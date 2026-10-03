// ============================================================
// Headstart Education — User Management (Admin Console → Users tab)
// GET    /api/users        — list all users (never includes password hashes)
// POST   /api/users        — create a user
// PUT    /api/users/:id    — edit name/email/role/active, or reset the password
// DELETE /api/users/:id    — remove a user
// Super admin only.
// ============================================================
const express = require('express');
const router  = express.Router();
const users   = require('../lib/users');
const { hashPassword, requireSuperAdmin } = require('../lib/auth');
const { logAudit } = require('./adminAuth');

router.use(requireSuperAdmin);

const USERNAME_RE = /^[a-z0-9._-]{3,50}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  return !email || EMAIL_RE.test(String(email).trim());
}

router.get('/', async (req, res) => {
  try {
    res.json(await users.list());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, password, name, email, role, is_active } = req.body || {};
    const safeUsername = String(username || '').trim().toLowerCase();

    if (!USERNAME_RE.test(safeUsername)) {
      return res.status(400).json({ message: 'Username must be 3–50 characters: letters, numbers, dot, dash or underscore' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!validateEmail(email)) return res.status(400).json({ message: 'That email address looks invalid' });
    if (!users.ROLES.includes(role)) {
      return res.status(400).json({ message: `Role must be one of: ${users.ROLES.join(', ')}` });
    }
    if (await users.findByUsername(safeUsername)) {
      return res.status(409).json({ message: 'That username already exists' });
    }

    const created = await users.create({
      username: safeUsername,
      email: email ? String(email).trim() : null,
      passwordHash: await hashPassword(password),
      name: String(name || '').trim() || safeUsername,
      role,
      isActive: is_active !== false,
    });
    await logAudit(req.admin, 'user.create', JSON.stringify({ username: created.username, role: created.role }));
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const target = await users.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const { name, email, role, is_active, password } = req.body || {};
    const changes = {};

    if (name !== undefined) changes.name = String(name).trim() || target.username;
    if (email !== undefined) {
      if (!validateEmail(email)) return res.status(400).json({ message: 'That email address looks invalid' });
      changes.email = email ? String(email).trim() : null;
    }
    if (role !== undefined) {
      if (!users.ROLES.includes(role)) {
        return res.status(400).json({ message: `Role must be one of: ${users.ROLES.join(', ')}` });
      }
      changes.role = role;
    }
    if (is_active !== undefined) changes.is_active = !!is_active;
    if (password) {
      if (String(password).length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }
      changes.password_hash = await hashPassword(password);
    }

    const losesSuperadmin =
      target.role === 'superadmin' && target.is_active &&
      ((changes.role !== undefined && changes.role !== 'superadmin') || changes.is_active === false);

    if (losesSuperadmin) {
      if (req.admin.id === target.id) {
        return res.status(400).json({ message: "You can't demote or disable your own account while logged in as it." });
      }
      if ((await users.countActiveSuperadmins(target.id)) === 0) {
        return res.status(400).json({ message: 'There must always be at least one active Super Admin.' });
      }
    }

    const updated = await users.update(target.id, changes);
    const { password_hash, ...logged } = changes;
    await logAudit(
      req.admin,
      'user.update',
      JSON.stringify({ username: target.username, ...logged, ...(password_hash ? { password: 'reset' } : {}) })
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.admin.id === req.params.id) {
      return res.status(400).json({ message: "You can't delete your own account while logged in as it." });
    }
    const target = await users.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (target.role === 'superadmin' && target.is_active &&
        (await users.countActiveSuperadmins(target.id)) === 0) {
      return res.status(400).json({ message: 'There must always be at least one active Super Admin.' });
    }

    await users.remove(target.id);
    await logAudit(req.admin, 'user.delete', JSON.stringify({ username: target.username }));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
