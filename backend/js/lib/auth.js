// ============================================================
// Headstart Education — Admin Authentication
// Same pattern as Kutumb's server/lib/auth.js: bcrypt-hashed
// passwords, a short-lived JWT carried in an httpOnly cookie
// (so the browser sends it automatically on every same-origin
// request — no manual token plumbing needed on the frontend).
// ============================================================
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

// Protects every admin-only route. Reads the session from the httpOnly
// cookie set at login (what the browser actually uses), and also accepts
// a Bearer header for any non-browser/API usage.
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const headerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = headerToken || req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Admin login required' });
  try {
    req.admin = jwt.verify(token, getSecret());
    next();
  } catch {
    return res.status(401).json({ message: 'Admin session expired — please log in again' });
  }
}

function requireSuperAdmin(req, res, next) {
  requireAdmin(req, res, () => {
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }
    next();
  });
}

module.exports = {
  hashPassword,
  comparePassword,
  signAdminToken,
  requireAdmin,
  requireSuperAdmin,
  ADMIN_COOKIE_NAME,
  COOKIE_OPTIONS,
};
