// ============================================================
// Headstart Education — Site images store
// Image bytes live in the `site_images` table (BYTEA) so they survive
// redeploys and can be changed from Admin Console → Images. Falls back
// to an in-memory copy (seeded from backend/seed-images) when no
// database is connected.
// ============================================================
const fs = require('fs');
const path = require('path');
const db = require('../db');
const catalog = require('./imageCatalog');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 6 * 1024 * 1024;
const byKey = Object.fromEntries(catalog.map((c) => [c.key, c]));

function seedDir() {
  return [path.join(__dirname, '..', 'seed-images'), path.join(__dirname, '..', '..', 'seed-images')]
    .find((p) => fs.existsSync(p)) || null;
}
function readSeed(key) {
  const dir = seedDir();
  const entry = byKey[key];
  if (!dir || !entry) return null;
  const file = path.join(dir, entry.file);
  return fs.existsSync(file) ? fs.readFileSync(file) : null;
}

// Identify the real image type from its first bytes (never trust the
// client-supplied Content-Type). SVG is deliberately not allowed — it can
// carry scripts.
function sniffMime(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buf.slice(0, 3).toString('ascii') === 'GIF') return 'image/gif';
  return null;
}

// Called after the schema is applied. Inserts any catalog image that is
// missing from the table (existing rows — including replaced images — are
// never touched). `query` is (sql, params) => Promise.
async function seed(query) {
  const { rows } = await query('SELECT key FROM site_images');
  const have = new Set(rows.map((r) => r.key));
  let added = 0;
  for (const c of catalog) {
    if (have.has(c.key)) continue;
    const buf = readSeed(c.key);
    if (!buf) continue;
    await query(
      `INSERT INTO site_images (key, label, purpose, mime_type, data, size_bytes)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (key) DO NOTHING`,
      [c.key, c.label, c.purpose, sniffMime(buf) || 'image/jpeg', buf, buf.length]
    );
    added++;
  }
  if (added) console.log(`🖼️  Seeded ${added} site image(s) into the database.`);
}

// ── In-memory helpers (no database) ────────────────────────
function memRow(key) {
  if (!byKey[key]) return null;
  if (!db.mem.images) db.mem.images = {};
  if (!db.mem.images[key]) {
    const buf = readSeed(key);
    if (!buf) return null;
    db.mem.images[key] = {
      key, label: byKey[key].label, purpose: byKey[key].purpose,
      mime_type: sniffMime(buf) || 'image/jpeg', data: buf, size_bytes: buf.length,
      is_custom: false, updated_by: null, updated_at: new Date(),
    };
  }
  return db.mem.images[key];
}

const withCatalog = (row) => ({
  key: row.key,
  label: row.label,
  purpose: row.purpose,
  mime_type: row.mime_type,
  size_bytes: row.size_bytes,
  is_custom: row.is_custom,
  updated_by: row.updated_by,
  updated_at: row.updated_at,
  usage: byKey[row.key]?.usage || [],
  recommended: byKey[row.key]?.recommended || '',
});

async function list() {
  if (db.isConnected()) {
    const { rows } = await db.query(
      'SELECT key,label,purpose,mime_type,size_bytes,is_custom,updated_by,updated_at FROM site_images'
    );
    const order = Object.fromEntries(catalog.map((c, i) => [c.key, i]));
    return rows.filter((r) => byKey[r.key]).sort((a, b) => order[a.key] - order[b.key]).map(withCatalog);
  }
  return catalog.map((c) => memRow(c.key)).filter(Boolean).map(withCatalog);
}

// Lightweight row (no bytes) — used for ETag checks.
async function head(key) {
  if (!byKey[key]) return null;
  if (db.isConnected()) {
    const { rows } = await db.query('SELECT key,mime_type,size_bytes,updated_at FROM site_images WHERE key=$1', [key]);
    if (rows[0]) return rows[0];
    return null;
  }
  return memRow(key);
}

async function getData(key) {
  if (db.isConnected()) {
    const { rows } = await db.query('SELECT mime_type, data FROM site_images WHERE key=$1', [key]);
    return rows[0] || null;
  }
  return memRow(key);
}

async function replace(key, buf, mime, by) {
  if (db.isConnected()) {
    await db.query(
      `UPDATE site_images SET data=$2, mime_type=$3, size_bytes=$4, is_custom=true, updated_by=$5, updated_at=NOW() WHERE key=$1`,
      [key, buf, mime, buf.length, by]
    );
  } else {
    const r = memRow(key);
    Object.assign(r, { data: buf, mime_type: mime, size_bytes: buf.length, is_custom: true, updated_by: by, updated_at: new Date() });
  }
}

async function updateDetails(key, { label, purpose }, by) {
  if (db.isConnected()) {
    await db.query('UPDATE site_images SET label=$2, purpose=$3, updated_by=$4 WHERE key=$1', [key, label, purpose, by]);
  } else {
    Object.assign(memRow(key), { label, purpose, updated_by: by });
  }
}

async function reset(key, by) {
  const buf = readSeed(key);
  if (!buf) throw new Error('The original image file is not available on this server.');
  const mime = sniffMime(buf) || 'image/jpeg';
  if (db.isConnected()) {
    await db.query(
      `UPDATE site_images SET data=$2, mime_type=$3, size_bytes=$4, is_custom=false, updated_by=$5, updated_at=NOW() WHERE key=$1`,
      [key, buf, mime, buf.length, by]
    );
  } else {
    Object.assign(memRow(key), { data: buf, mime_type: mime, size_bytes: buf.length, is_custom: false, updated_by: by, updated_at: new Date() });
  }
}

module.exports = { ALLOWED, MAX_BYTES, catalog, byKey, sniffMime, seed, list, head, getData, replace, updateDetails, reset };
