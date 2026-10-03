// ============================================================
// Headstart Education — Database Layer
// Connects to Neon PostgreSQL (or any Postgres) via DATABASE_URL.
// Falls back to an in-memory store if no database is reachable,
// so the app still runs for quick local testing without one.
// ============================================================

const { Pool } = require('pg');

// ── In-memory fallback store ──────────────────────────────
const memStore = {
  donations: [],
  programs: [
    { id:'p1', name:'First Project — Rural School, Uttar Pradesh', category:'Infrastructure', description:'Our first project is currently in development. We have identified a school in a rural village in Uttar Pradesh where there is a need for additional classroom infrastructure and learning resources. We are currently completing the groundwork required to begin supporting the school.', location:'Uttar Pradesh, India', goal_amount:0, raised_amount:0, status:'fundraising', image_url:null, created_at: new Date() },
  ],
  providers: [
    { id:'v1', name:'Square',            type:'square',  is_active:true,  created_at: new Date() },
    { id:'v2', name:'Manual / Bank Transfer', type:'manual', is_active:true, created_at: new Date() },
  ],
  adminUsers: [],   // populated by bootstrapAdmin.js on startup
  auditLog: [],
  nextId: 1000,
};

// ── Build a Postgres connection string ─────────────────────
// Preferred: a single DATABASE_URL (this is how Neon gives you your
// connection details — copy it straight from the Neon dashboard). Falls
// back to assembling one from discrete DB_* vars for a plain local Postgres
// install that isn't using a connection string.
function resolveConnectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const name = process.env.DB_NAME || 'hseducation';
  const user = process.env.DB_USER || 'hse_user';
  const pass = process.env.DB_PASSWORD || 'hse_password';
  return `postgresql://${user}:${pass}@${host}:${port}/${name}`;
}

// node-postgres re-parses `connectionString` and lets any SSL mode embedded
// in it (e.g. Neon's `?sslmode=require`) silently override an explicit
// `ssl` option passed alongside it, which can crash the driver. Strip it
// out of the URL and set SSL explicitly instead — same approach Kutumb uses.
function stripSslParams(connectionString) {
  try {
    const url = new URL(connectionString);
    url.searchParams.delete('sslmode');
    url.searchParams.delete('ssl');
    return url.toString();
  } catch {
    return connectionString;
  }
}

function buildPoolConfig() {
  const rawUrl = resolveConnectionString();
  const connectionString = stripSslParams(rawUrl);
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  return {
    connectionString,
    // Neon (and most managed Postgres) requires TLS; a plain local
    // install on localhost typically doesn't have a cert configured.
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  };
}

// ── Try PostgreSQL ────────────────────────────────────────
let pool = null;
let usingDB = false;

// Resolves once the initial connectivity check (below) has completed, so
// startup code (like creating the default admin user) can wait for a
// definitive answer instead of racing the async check.
let resolveReady;
const readyPromise = new Promise((resolve) => { resolveReady = resolve; });

try {
  pool = new Pool(buildPoolConfig());

  pool.on('error', (err) => {
    // A dropped idle connection shouldn't crash the whole server.
    console.error('⚠️  Unexpected PostgreSQL pool error:', err.message);
  });

  pool.query('SELECT NOW()')
    .then(() => {
      usingDB = true;
      const which = process.env.DATABASE_URL ? 'Neon/DATABASE_URL' : 'DB_* vars';
      console.log(`✅ PostgreSQL connected (${which}) — using database`);
    })
    .catch((err) => {
      usingDB = false;
      console.log('⚠️  PostgreSQL not available — using in-memory store');
      console.log(`   Reason: ${err.message}`);
      console.log('   See backend/js/.env.example to configure DATABASE_URL (Neon).');
    })
    .finally(() => resolveReady());

} catch (e) {
  console.log('⚠️  PostgreSQL not configured — using in-memory store');
  resolveReady();
}

// ── Unified query interface ───────────────────────────────
// Routes use db.query() and db.mem — automatically routes to
// PostgreSQL when available, in-memory store when not.

const db = {

  // Raw SQL query (PostgreSQL only)
  query: async (sql, params) => {
    if (usingDB && pool) return pool.query(sql, params);
    throw new Error('PostgreSQL not connected');
  },

  // Is database available?
  isConnected: () => usingDB,

  // Resolves once the initial PostgreSQL connectivity check has finished —
  // await this before code that needs a definitive "DB or in-memory?" answer
  // right at startup (e.g. bootstrapAdmin.js).
  ready: () => readyPromise,

  // In-memory store (always available as fallback)
  mem: memStore,

  // Generate a simple unique ID for in-memory records
  newId: () => `mem_${++memStore.nextId}_${Date.now()}`,
};

module.exports = db;
