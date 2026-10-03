// ============================================================
// Headstart Education — Users data access
// One place that knows how to read/write the `users` table (or the
// in-memory fallback), so routes and auth middleware don't repeat it.
// ============================================================
const db = require('../db');

const ROLES = ['superadmin', 'admin', 'editor', 'viewer'];
const SAFE_COLS = 'id, username, email, name, role, is_active, last_login_at, created_at, updated_at';

const stripHash = ({ password_hash, ...safe }) => safe;

async function findByUsername(username) {
  if (db.isConnected()) {
    const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0] || null;
  }
  return db.mem.users.find((u) => u.username === username) || null;
}

async function findById(id) {
  if (!id) return null;
  if (db.isConnected()) {
    try {
      const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
      return rows[0] || null;
    } catch (err) {
      if (err.code === '22P02') return null; // not a valid uuid → no such user
      throw err;
    }
  }
  return db.mem.users.find((u) => u.id === id) || null;
}

async function list() {
  if (db.isConnected()) {
    const { rows } = await db.query(`SELECT ${SAFE_COLS} FROM users ORDER BY created_at ASC`);
    return rows;
  }
  return db.mem.users.map(stripHash);
}

async function count() {
  if (db.isConnected()) {
    const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM users');
    return rows[0].n;
  }
  return db.mem.users.length;
}

// Active super admins, optionally ignoring one id — used to make sure the
// console can never be left without anyone able to manage it.
async function countActiveSuperadmins(excludeId = null) {
  if (db.isConnected()) {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS n FROM users
       WHERE role = 'superadmin' AND is_active = true AND ($1::uuid IS NULL OR id <> $1::uuid)`,
      [excludeId]
    );
    return rows[0].n;
  }
  return db.mem.users.filter((u) => u.role === 'superadmin' && u.is_active && u.id !== excludeId).length;
}

async function create({ username, email, passwordHash, name, role, isActive }) {
  if (db.isConnected()) {
    const { rows } = await db.query(
      `INSERT INTO users (username, email, password_hash, name, role, is_active)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${SAFE_COLS}`,
      [username, email || null, passwordHash, name, role, isActive !== false]
    );
    return rows[0];
  }
  const user = {
    id: db.newId(), username, email: email || null, password_hash: passwordHash,
    name, role, is_active: isActive !== false, last_login_at: null,
    created_at: new Date(), updated_at: new Date(),
  };
  db.mem.users.push(user);
  return stripHash(user);
}

const UPDATABLE = ['name', 'email', 'role', 'is_active', 'password_hash'];

async function update(id, fields) {
  const entries = Object.entries(fields).filter(([k, v]) => UPDATABLE.includes(k) && v !== undefined);
  if (entries.length === 0) return findById(id).then((u) => u && stripHash(u));
  if (db.isConnected()) {
    const setClause = entries.map(([k], i) => `"${k}" = $${i + 1}`).join(', ');
    const values = entries.map(([, v]) => v);
    values.push(id);
    const { rows } = await db.query(
      `UPDATE users SET ${setClause} WHERE id = $${values.length} RETURNING ${SAFE_COLS}`,
      values
    );
    return rows[0] || null;
  }
  const user = db.mem.users.find((u) => u.id === id);
  if (!user) return null;
  entries.forEach(([k, v]) => { user[k] = v; });
  user.updated_at = new Date();
  return stripHash(user);
}

async function remove(id) {
  if (db.isConnected()) {
    const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [id]);
    return rowCount > 0;
  }
  const i = db.mem.users.findIndex((u) => u.id === id);
  if (i === -1) return false;
  db.mem.users.splice(i, 1);
  return true;
}

async function touchLogin(id) {
  if (db.isConnected()) {
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
    return;
  }
  const user = db.mem.users.find((u) => u.id === id);
  if (user) user.last_login_at = new Date();
}

module.exports = {
  ROLES, stripHash, findByUsername, findById, list, count,
  countActiveSuperadmins, create, update, remove, touchLogin,
};
