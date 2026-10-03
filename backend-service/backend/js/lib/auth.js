// ============================================================
// Headstart Education — Authentication & Roles
// bcrypt-hashed passwords, a short-lived JWT carried in an httpOnly
// cookie (so the browser sends it automatically on every same-origin
// request — no manual token plumbing needed on the frontend).
//
// Roles (see the `users` table):
//   superadmin — everything, incl. Users, Square Settings, Database Tables
//   admin      — donations (view + update status) and projects
//   editor     — view donations, create/edit/delete projects
//   viewer     — read-only access to donations and projects
//
// Every protected request re-checks the user in the database, so
// disabling an account or changing its role takes effect immediately
// rather than waiting for the 12h token to expire.
// ============================================================
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const users  = require('./users');

function getSecret() {
  return process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
}

async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}

async function comparePassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}

function signAdminToken(admin) {
  return jwt.sign(
    { id: admin.id, username: admin.username, name: admin.name, role: admin.role },
    getSecret(),
    { expiresIn: '12h' }
  );
}

const ADMIN_COOKIE_NAME = 'headstart_admin_token';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 12 * 60 * 60 * 1000, // 12h, matches the JWT's own expiry
};

// Any logged-in, active user (all roles). Reads the session from the
// httpOnly cookie set at login, and also accepts a Bearer header for any
// non-browser/API usage.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const headerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = headerToken || req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Admin login required' });

  let payload;
  try {
    payload = jwt.verify(token, getSecret());
  } catch {
    return res.status(401).json({ message: 'Admin session expired — please log in again' });
  }

  try {
    const user = await users.findById(payload.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'This account is disabled or no longer exists' });
    }
    // Use the *current* role from the database, not the one baked into the token.
    req.admin = { id: user.id, username: user.username, name: user.name, role: user.role };
    next();
  } catch (err) {
    console.error('AUTH CHECK ERROR:', err);
    res.status(500).json({ message: 'Could not verify your session' });
  }
}

function requireRole(...allowed) {
  return (req, res, next) =>
    requireAuth(req, res, () => {
      if (!allowed.includes(req.admin.role)) {
        return res.status(403).json({ message: 'You do not have permission to do that' });
      }
      next();
    });
}

const requireStaff      = requireAuth;                                      // any role: read-only views
const requireEditor     = requireRole('editor', 'admin', 'superadmin');     // manage projects
const requireAdmin      = requireRole('admin', 'superadmin');               // manage donations, providers
const requireSuperAdmin = requireRole('superadmin');                        // users, Square, database

module.exports = {
  hashPassword,
  comparePassword,
  signAdminToken,
  requireAuth,
  requireStaff,
  requireEditor,
  requireAdmin,
  requireSuperAdmin,
  ADMIN_COOKIE_NAME,
  COOKIE_OPTIONS,
};
