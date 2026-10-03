// ============================================================
// Headstart Education — Ensure schema (runs automatically on every
// successful database connection)
// Applies app_db/01_schema.sql (CREATE TABLE IF NOT EXISTS …, safe to
// repeat) and seeds 02_seed.sql into a completely empty database.
// This is what lets a fresh Northflank deploy work against an empty Neon
// database with no manual `npm run migrate` step.
// ============================================================
const fs = require('fs');
const path = require('path');

// In the Docker image app_db sits next to server.js; in the repo it is at backend/app_db.
function findSql(name) {
  const candidates = [
    path.join(__dirname, '..', 'app_db', name),
    path.join(__dirname, '..', '..', 'app_db', name),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

module.exports = async function ensureSchema(pool) {
  const schemaPath = findSql('01_schema.sql');
  if (!schemaPath) {
    throw new Error('01_schema.sql not found — make sure the Docker image copies backend/app_db');
  }
  await pool.query(fs.readFileSync(schemaPath, 'utf-8'));
  console.log('✅ Database schema is up to date.');

  const { rows } = await pool.query(
    'SELECT (SELECT COUNT(*) FROM programs) + (SELECT COUNT(*) FROM providers) AS total'
  );
  if (parseInt(rows[0].total, 10) === 0) {
    const seedPath = findSql('02_seed.sql');
    if (seedPath) {
      await pool.query(fs.readFileSync(seedPath, 'utf-8'));
      console.log('🌱 Empty database — seed data applied.');
    }
  }
};
