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
// Images uploaded from Admin Console → Images → "Add image" (not tied to a page slot).
const isLibrary = (key) => /^lib_[a-f0-9]{10}$/.test(String(key || ''));
const crypto = require('crypto');

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
  const { rows } = await query('SELECT key, size_bytes, is_custom FROM site_images');
  const have = new Set(rows.map((r) => r.key));
  const existing = Object.fromEntries(rows.map((r) => [r.key, r]));
  let added = 0, refreshed = 0;
  for (const c of catalog) {
    if (have.has(c.key)) {
      // Never touch a photo that was uploaded from the Admin Console. An untouched
      // original is refreshed if the file shipped with the site has changed.
      const cur = existing[c.key];
      if (cur && !cur.is_custom) {
        const b = readSeed(c.key);
        if (b && b.length !== cur.size_bytes) {
          await query(`UPDATE site_images SET data=$2, mime_type=$3, size_bytes=$4, label=$5, purpose=$6, updated_at=NOW() WHERE key=$1 AND is_custom=false`,
            [c.key, b, sniffMime(b) || 'image/jpeg', b.length, c.label, c.purpose]);
          refreshed++;
        }
      }
      continue;
    }
    const buf = readSeed(c.key);
    if (!buf) continue;
    await query(
      `INSERT INTO site_images (key, label, purpose, mime_type, data, size_bytes)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (key) DO NOTHING`,
      [c.key, c.label, c.purpose, sniffMime(buf) || 'image/jpeg', buf, buf.length]
    );
    added++;
  }
  // Drop retired originals (e.g. old spare photos) that are no longer in the catalog.
  // Photos uploaded from the Admin Console (is_custom) are never deleted.
  const known = catalog.map((c) => c.key);
  const gone = await query('DELETE FROM site_images WHERE is_custom = false AND NOT (key = ANY($1::text[]))', [known]);
  if (gone && gone.rowCount) console.log(`🖼️  Removed ${gone.rowCount} unused site image(s) from the database.`);
  if (added) console.log(`🖼️  Seeded ${added} site image(s) into the database.`);
  if (refreshed) console.log(`🖼️  Refreshed ${refreshed} original site image(s) with the updated versions.`);
}

// ── In-memory helpers (no database) ────────────────────────
function memRow(key) {
  if (!db.mem.images) db.mem.images = {};
  if (isLibrary(key)) return db.mem.images[key] || null;
  if (!byKey[key]) return null;
  if (!db.mem.images[key]) {
    const buf = readSeed(key);
    if (!buf) return null;
    db.mem.images[key] = {
      key, label: byKey[key].label, purpose: byKey[key].purpose,
      mime_type: sniffMime(buf) || 'image/jpeg', data: buf, size_bytes: buf.length,
      is_custom: false, is_deleted: false, is_hidden: false, updated_by: null, updated_at: new Date(),
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
  is_deleted: !!row.is_deleted,
  is_hidden: !!row.is_hidden,
  updated_by: row.updated_by,
  updated_at: row.updated_at,
  usage: byKey[row.key]?.usage || [],
  recommended: byKey[row.key]?.recommended || '',
});

async function list() {
  if (db.isConnected()) {
    const { rows } = await db.query(
      'SELECT key,label,purpose,mime_type,size_bytes,is_custom,is_deleted,is_hidden,updated_by,updated_at FROM site_images'
    );
    const order = Object.fromEntries(catalog.map((c, i) => [c.key, i]));
    const built = rows.filter((r) => byKey[r.key]).sort((a, b) => order[a.key] - order[b.key]);
    const lib = rows.filter((r) => isLibrary(r.key)).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return [...built, ...lib].map(withCatalog);
  }
  const lib = Object.values(db.mem.images || {}).filter((r) => isLibrary(r.key)).sort((a, b) => b.updated_at - a.updated_at);
  return [...catalog.map((c) => memRow(c.key)).filter(Boolean), ...lib].map(withCatalog);
}

// Lightweight row (no bytes) — used for ETag checks.
async function head(key) {
  if (!byKey[key] && !isLibrary(key)) return null;
  if (db.isConnected()) {
    const { rows } = await db.query('SELECT key,mime_type,size_bytes,is_deleted,is_hidden,updated_at FROM site_images WHERE key=$1', [key]);
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
      `UPDATE site_images SET data=$2, mime_type=$3, size_bytes=$4, is_custom=true, is_deleted=false, updated_by=$5, updated_at=NOW() WHERE key=$1`,
      [key, buf, mime, buf.length, by]
    );
  } else {
    const r = memRow(key);
    Object.assign(r, { data: buf, mime_type: mime, size_bytes: buf.length, is_custom: true, is_deleted: false, updated_by: by, updated_at: new Date() });
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
      `UPDATE site_images SET data=$2, mime_type=$3, size_bytes=$4, is_custom=false, is_deleted=false, updated_by=$5, updated_at=NOW() WHERE key=$1`,
      [key, buf, mime, buf.length, by]
    );
  } else {
    Object.assign(memRow(key), { data: buf, mime_type: mime, size_bytes: buf.length, is_custom: false, is_deleted: false, updated_by: by, updated_at: new Date() });
  }
}

// Adds a new library image (not tied to a page slot). Returns its key.
async function create(buf, mime, label, by) {
  const key = `lib_${crypto.randomBytes(5).toString('hex')}`;
  const name = String(label || '').trim().slice(0, 150) || 'Untitled image';
  const purpose = 'Library image — not placed on any page yet.';
  if (db.isConnected()) {
    await db.query(
      `INSERT INTO site_images (key, label, purpose, mime_type, data, size_bytes, is_custom, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,true,$7)`, [key, name, purpose, mime, buf, buf.length, by]);
  } else {
    if (!db.mem.images) db.mem.images = {};
    db.mem.images[key] = { key, label: name, purpose, mime_type: mime, data: buf, size_bytes: buf.length,
      is_custom: true, updated_by: by, updated_at: new Date() };
  }
  return key;
}

// Deletes an image.
//  • Library images (uploaded with "Add image") are erased for good.
//  • Built-in images belong to a spot on a page, so they are hidden rather than
//    erased: the spot is left blank on the website and the image can be restored.
async function remove(key, by) {
  const notFound = () => { const e = new Error('Image not found'); e.status = 404; return e; };
  if (isLibrary(key)) {
    if (db.isConnected()) {
      const { rowCount } = await db.query('DELETE FROM site_images WHERE key = $1', [key]);
      if (!rowCount) throw notFound();
    } else if (db.mem.images && db.mem.images[key]) {
      delete db.mem.images[key];
    } else throw notFound();
    return 'deleted';
  }
  if (!byKey[key]) throw notFound();
  if (db.isConnected()) {
    const { rowCount } = await db.query('UPDATE site_images SET is_deleted=true, updated_by=$2, updated_at=NOW() WHERE key=$1', [key, by || null]);
    if (!rowCount) throw notFound();
  } else {
    const r = memRow(key); if (!r) throw notFound();
    Object.assign(r, { is_deleted: true, updated_by: by || null, updated_at: new Date() });
  }
  return 'hidden';
}

// Switches an image on/off on the website without deleting it.
async function setHidden(key, hidden, by) {
  if (!byKey[key] && !isLibrary(key)) { const e = new Error('Unknown image'); e.status = 404; throw e; }
  if (db.isConnected()) {
    const { rowCount } = await db.query('UPDATE site_images SET is_hidden=$2, updated_by=$3, updated_at=NOW() WHERE key=$1', [key, !!hidden, by || null]);
    if (!rowCount) { const e = new Error('Image not found'); e.status = 404; throw e; }
  } else {
    const r = memRow(key); if (!r) { const e = new Error('Image not found'); e.status = 404; throw e; }
    Object.assign(r, { is_hidden: !!hidden, updated_by: by || null, updated_at: new Date() });
  }
}

// Brings a deleted built-in image back exactly as it was.
async function restore(key, by) {
  if (!byKey[key]) { const e = new Error('Unknown image'); e.status = 404; throw e; }
  if (db.isConnected()) {
    await db.query('UPDATE site_images SET is_deleted=false, updated_by=$2, updated_at=NOW() WHERE key=$1', [key, by || null]);
  } else {
    const r = memRow(key); if (r) Object.assign(r, { is_deleted: false, updated_by: by || null, updated_at: new Date() });
  }
}

module.exports = { ALLOWED, MAX_BYTES, catalog, byKey, isLibrary, sniffMime, seed, list, head, getData, replace, updateDetails, reset, create, remove, restore, setHidden };
