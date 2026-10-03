// ============================================================
// Headstart Education — Contacts & email audiences
// Members/partners live in the `contacts` table. Donors are read from
// `donations`. Anyone who unsubscribes is stored in `contacts` with
// is_subscribed=false and is skipped by every bulk send.
// Works against PostgreSQL or the in-memory fallback.
// ============================================================
const crypto = require('crypto');
const db = require('../db');

const TYPES = ['member', 'partner', 'donor', 'other'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const norm = (e) => String(e || '').trim().toLowerCase();

function mem() { if (!db.mem.contacts) db.mem.contacts = []; return db.mem.contacts; }

async function list(type) {
  if (db.isConnected()) {
    const { rows } = await db.query(
      `SELECT * FROM contacts WHERE ($1::text IS NULL OR type = $1) ORDER BY created_at DESC LIMIT 2000`, [type || null]);
    return rows;
  }
  return mem().filter((c) => !type || c.type === type).slice().reverse();
}

async function create({ name, email, organisation, type, notes, is_subscribed = true }) {
  const e = norm(email);
  if (!EMAIL_RE.test(e)) throw Object.assign(new Error(`“${email}” is not a valid email address.`), { status: 400 });
  if (!String(name || '').trim()) throw Object.assign(new Error('Name is required.'), { status: 400 });
  if (!TYPES.includes(type)) throw Object.assign(new Error('Type must be member, partner, donor or other.'), { status: 400 });
  if (db.isConnected()) {
    try {
      const { rows } = await db.query(
        `INSERT INTO contacts (name,email,organisation,type,notes,is_subscribed) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [String(name).trim(), e, organisation || null, type, notes || null, !!is_subscribed]);
      return rows[0];
    } catch (err) {
      if (err.code === '23505') throw Object.assign(new Error(`${e} is already in your contacts.`), { status: 409 });
      throw err;
    }
  }
  if (mem().some((c) => c.email === e)) throw Object.assign(new Error(`${e} is already in your contacts.`), { status: 409 });
  const row = { id: db.newId(), name: String(name).trim(), email: e, organisation: organisation || null, type, notes: notes || null,
    is_subscribed: !!is_subscribed, created_at: new Date(), updated_at: new Date() };
  mem().push(row);
  return row;
}

async function update(id, fields) {
  const allowed = ['name', 'organisation', 'type', 'notes', 'is_subscribed'];
  const sets = []; const vals = [];
  for (const k of allowed) {
    if (fields[k] === undefined) continue;
    if (k === 'type' && !TYPES.includes(fields[k])) throw Object.assign(new Error('Invalid type.'), { status: 400 });
    vals.push(k === 'is_subscribed' ? !!fields[k] : fields[k]); sets.push(`${k} = $${vals.length}`);
  }
  if (!sets.length) throw Object.assign(new Error('Nothing to update.'), { status: 400 });
  if (db.isConnected()) {
    vals.push(id);
    const { rows } = await db.query(`UPDATE contacts SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`, vals);
    return rows[0] || null;
  }
  const row = mem().find((c) => c.id === id);
  if (!row) return null;
  for (const k of allowed) if (fields[k] !== undefined) row[k] = k === 'is_subscribed' ? !!fields[k] : fields[k];
  row.updated_at = new Date();
  return row;
}

async function remove(id) {
  if (db.isConnected()) {
    const { rowCount } = await db.query('DELETE FROM contacts WHERE id = $1', [id]);
    return rowCount > 0;
  }
  const i = mem().findIndex((c) => c.id === id);
  if (i < 0) return false;
  mem().splice(i, 1);
  return true;
}

// Records an unsubscribe for ANY email (donor, member, partner, stranger).
async function unsubscribe(email) {
  const e = norm(email);
  if (!EMAIL_RE.test(e)) return false;
  if (db.isConnected()) {
    const upd = await db.query('UPDATE contacts SET is_subscribed=false, updated_at=NOW() WHERE LOWER(email)=$1', [e]);
    if (!upd.rowCount) {
      await db.query(`INSERT INTO contacts (name,email,type,is_subscribed) VALUES ($1,$2,'donor',false) ON CONFLICT DO NOTHING`, [e.split('@')[0], e]);
    }
    return true;
  }
  const row = mem().find((c) => c.email === e);
  if (row) row.is_subscribed = false;
  else mem().push({ id: db.newId(), name: e.split('@')[0], email: e, type: 'donor', is_subscribed: false, created_at: new Date(), updated_at: new Date() });
  return true;
}

// ── Audiences ──────────────────────────────────────────────
// Returns [{ name, first_name, email, organisation }] — subscribed only.
async function audience(kind) {
  let people = [];
  if (kind === 'donors') {
    if (db.isConnected()) {
      const { rows } = await db.query(
        `SELECT DISTINCT ON (LOWER(email)) first_name, last_name, email FROM donations
         WHERE email IS NOT NULL AND email <> '' AND status <> 'failed' ORDER BY LOWER(email), created_at DESC`);
      people = rows.map((r) => ({ first_name: r.first_name, name: [r.first_name, r.last_name].filter(Boolean).join(' '), email: norm(r.email), organisation: '' }));
    } else {
      const seen = new Set();
      for (const d of db.mem.donations.slice().reverse()) {
        const e = norm(d.email);
        if (!e || d.status === 'failed' || seen.has(e)) continue;
        seen.add(e);
        people.push({ first_name: d.first_name, name: [d.first_name, d.last_name].filter(Boolean).join(' '), email: e, organisation: '' });
      }
    }
  } else if (kind === 'members' || kind === 'partners') {
    const rows = await list(kind === 'members' ? 'member' : 'partner');
    people = rows.filter((c) => c.is_subscribed).map((c) => ({
      first_name: String(c.name).split(' ')[0], name: c.name, email: norm(c.email), organisation: c.organisation || '' }));
  } else {
    throw Object.assign(new Error('Audience must be donors, members or partners.'), { status: 400 });
  }
  // Drop anyone who has opted out (e.g. an unsubscribed donor).
  const all = await list();
  const optedOut = new Set(all.filter((c) => !c.is_subscribed).map((c) => norm(c.email)));
  return people.filter((p) => EMAIL_RE.test(p.email) && !optedOut.has(p.email));
}

async function counts() {
  const [donors, members, partners] = await Promise.all(['donors', 'members', 'partners'].map((k) => audience(k)));
  return { donors: donors.length, members: members.length, partners: partners.length };
}

// ── Unsubscribe tokens (HMAC, no database needed) ──────────
function secret() { return process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me'; }
function unsubToken(email) {
  return crypto.createHmac('sha256', secret()).update(`unsub:${norm(email)}`).digest('hex').slice(0, 32);
}
function verifyUnsubToken(email, token) {
  const a = Buffer.from(unsubToken(email)); const b = Buffer.from(String(token || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { TYPES, EMAIL_RE, norm, list, create, update, remove, unsubscribe, audience, counts, unsubToken, verifyUnsubToken };
