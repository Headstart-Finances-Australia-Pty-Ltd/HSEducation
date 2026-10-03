// ============================================================
// Headstart Education — Database Migration
// Run with: node migrate.js  (or `npm run migrate`)
//
// Applies 01_schema.sql (creates tables if they don't exist) and, on a
// freshly-empty database only, 02_seed.sql. Safe to run every time —
// it's a no-op on a database that's already set up. Used by app.cmd on
// every launch so a Neon database stays in sync automatically.
// ============================================================
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Add your Neon connection string to backend/js/.env and re-run.');
    console.error('   See backend/js/.env.example for the exact format.');
    process.exit(1);
  }

  // Reuses the same pool/SSL logic as the rest of the app (db.js), so
  // migrate.js connects exactly the same way the server itself will.
  const db = require('./db');
  await db.ready();

  if (!db.isConnected()) {
    console.error('❌ Could not connect to the database at DATABASE_URL.');
    console.error('   Double-check the connection string against your Neon dashboard (Connection Details).');
    process.exit(1);
  }

  console.log('🔌 Connected. Applying schema (creating tables if they don\'t exist)...');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../app_db/01_schema.sql'), 'utf-8');
  await db.query(schemaSql);
  console.log('✅ Schema is up to date.');

  // Only seed a genuinely empty database — donations/programs/providers
  // have no natural unique key to safely re-run an INSERT against, and
  // this script may run on every app.cmd launch.
  const { rows } = await db.query(
    `SELECT (SELECT COUNT(*) FROM programs) + (SELECT COUNT(*) FROM providers) AS total`
  );
  if (parseInt(rows[0].total, 10) === 0) {
    const seedPath = path.join(__dirname, '../app_db/02_seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('🌱 Database is empty — applying seed data...');
      await db.query(fs.readFileSync(seedPath, 'utf-8'));
      console.log('✅ Seed data applied.');
    }
  } else {
    console.log('👍 Programs/providers already have data — skipping seed (safe to re-run anytime).');
  }

  // Creates the default admin login if none exists yet (same thing
  // server.js does on every startup — calling it here too means a fresh
  // Neon database has a working login immediately after migrating).
  const bootstrapAdmin = require('./bootstrapAdmin');
  await bootstrapAdmin();

  console.log('🎉 Migration complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exitCode = 1;
});
