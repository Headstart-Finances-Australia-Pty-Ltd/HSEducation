// ============================================================
// Headstart Education — App Settings store
// Key/value settings edited from the Admin Console (Square credentials).
// Secret values (e.g. the Square access token) are encrypted with
// AES-256-GCM before being written to the database, so a database dump
// or the Database Tables tab never exposes them in plain text.
//
// The encryption key comes from SETTINGS_ENCRYPTION_KEY, falling back to
// JWT_SECRET. If you change that value later, previously saved secrets
// can no longer be decrypted and simply need re-entering in the console.
// ============================================================
const crypto = require('crypto');
const db = require('../db');

const PREFIX = 'enc:v1:';

function encryptionKey() {
  const secret =
    process.env.SETTINGS_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'dev-only-insecure-secret-change-me';
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

function decrypt(stored) {
  if (typeof stored !== 'string' || !stored.startsWith(PREFIX)) return stored;
  try {
    const [iv, tag, data] = stored.slice(PREFIX.length).split(':').map((p) => Buffer.from(p, 'base64'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    console.warn('⚠️  Could not decrypt a saved setting (encryption key changed?). Re-enter it in the Admin Console.');
    return null;
  }
}

// All settings whose key starts with `prefix`, as { key: plainValue }.
async function getAll(prefix = '') {
  const out = {};
  if (db.isConnected()) {
    const { rows } = await db.query(
      'SELECT key, value, is_secret FROM app_settings WHERE key LIKE $1',
      [`${prefix}%`]
    );
    rows.forEach((r) => { out[r.key] = r.is_secret ? decrypt(r.value) : r.value; });
    return out;
  }
  Object.entries(db.mem.settings).forEach(([key, row]) => {
    if (key.startsWith(prefix)) out[key] = row.is_secret ? decrypt(row.value) : row.value;
  });
  return out;
}

// entries: { 'square.location_id': { value: 'L123' },
//            'square.access_token': { value: 'EAAA…', secret: true } }
// A null/empty value deletes that setting.
async function setMany(entries, updatedBy = null) {
  for (const [key, { value, secret }] of Object.entries(entries)) {
    const empty = value === null || value === undefined || value === '';
    if (db.isConnected()) {
      if (empty) {
        await db.query('DELETE FROM app_settings WHERE key = $1', [key]);
      } else {
        await db.query(
          `INSERT INTO app_settings (key, value, is_secret, updated_by, updated_at)
           VALUES ($1,$2,$3,$4,NOW())
           ON CONFLICT (key) DO UPDATE
             SET value = EXCLUDED.value, is_secret = EXCLUDED.is_secret,
                 updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
          [key, secret ? encrypt(value) : value, !!secret, updatedBy]
        );
      }
    } else if (empty) {
      delete db.mem.settings[key];
    } else {
      db.mem.settings[key] = { value: secret ? encrypt(value) : value, is_secret: !!secret };
    }
  }
}

module.exports = { getAll, setMany };
