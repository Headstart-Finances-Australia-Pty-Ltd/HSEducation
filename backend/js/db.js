// ============================================================
// Headstart Education — Database Layer
// Connects to Neon PostgreSQL (or any Postgres) via DATABASE_URL.
// Retries (Neon may be waking up) and falls back to an in-memory store
// meanwhile, so the app still starts; it switches to Postgres by itself
// as soon as the connection succeeds.
// ============================================================

const { Pool } = require('pg');

// ── In-memory fallback store ──────────────────────────────
const memStore = {
  donations: [],
  programs: [
    { id:'p1', name:'First Project — Rural School, Uttar Pradesh', category:'Infrastructure', description:'Our first project is currently in development. We have identified a school in a rural village in Uttar Pradesh where there is a need for additional classroom infrastructure and learning resources. We are currently completing the groundwork required to begin supporting the school.', location:'Uttar Pradesh, India', goal_amount:0, raised_amount:0, status:'fundraising', is_visible:true, image_url:null, created_at: new Date() },
  ],
  providers: [
    { id:'v1', name:'Square',            type:'square',  is_active:true,  created_at: new Date() },
    { id:'v2', name:'Manual / Bank Transfer', type:'manual', is_active:true, created_at: new Date() },
  ],
  users: [],        // populated by bootstrapAdmin.js on startup
  settings: {},     // key -> { value, is_secret }  (Admin Console settings)
  auditLog: [],
  nextId: 1000,
};

// ── Build a Postgres connection string ─────────────────────
// Preferred: a single DATABASE_URL (this is how Neon gives you your
// connection details — copy it straight from the Neon dashboard). Falls
// back to assembling one from discrete DB_* vars for a plain local Postgres
// install that isn't using a connection string.
//
// The value is cleaned up first, because hosting dashboards (Northflank,
// etc.) store exactly what was pasted: Neon's "Connection string" box can
// copy as  psql 'postgresql://…'  and people often paste surrounding quotes
// or a trailing newline. Any of those make the URL invalid.
function cleanUrl(raw) {
  if (!raw) return '';
  let v = String(raw).trim();
  v = v.replace(/^psql\s+/i, '');                 // "psql 'postgresql://…'"
  v = v.replace(/^DATABASE_URL\s*=\s*/i, '');      // "DATABASE_URL=postgresql://…"
  v = v.replace(/^['"]+|['"]+$/g, '').trim();      // surrounding quotes
  return v;
}

function resolveConnectionString() {
  const fromEnv = cleanUrl(process.env.DATABASE_URL);
  if (fromEnv) return fromEnv;
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
// out of the URL and set SSL explicitly instead. `channel_binding` is also
// dropped — Neon adds it to copied strings, node-postgres doesn't use it.
function stripSslParams(connectionString) {
  try {
    const url = new URL(connectionString);
    ['sslmode', 'ssl', 'channel_binding'].forEach((p) => url.searchParams.delete(p));
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
    // Neon scales idle databases to zero; the first connection after a
    // pause can take 5–10s to wake it, so a short timeout fails spuriously.
    connectionTimeoutMillis: 20000,
  };
}

// ── Connection state ──────────────────────────────────────
let pool = null;
let usingDB = false;
let lastError = null;          // last connection/migration error message (no secrets)
const hasDbConfig = !!(cleanUrl(process.env.DATABASE_URL) || process.env.DB_HOST);

// Resolves once the *initial* connection attempts have finished (success or
// not), so startup code (like creating the default admin user) can wait for
// a definitive answer instead of racing the async check.
let resolveReady;
const readyPromise = new Promise((resolve) => { resolveReady = resolve; });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Remove anything that looks like credentials from an error before it is
// logged or shown in the admin console.
function safeMessage(err) {
  return String(err && err.message ? err.message : err)
    .replace(/(postgres(?:ql)?:\/\/)[^@\s]+@/gi, '$1***@');
}

async function connectOnce() {
  if (pool) { try { await pool.end(); } catch { /* ignore */ } }
  pool = new Pool(buildPoolConfig());
  pool.on('error', (err) => {
    // A dropped idle connection shouldn't crash the whole server.
    console.error('⚠️  Unexpected PostgreSQL pool error:', safeMessage(err));
  });
  await pool.query('SELECT NOW()');

  // Create/upgrade tables on every successful connect (idempotent) so a
  // freshly-deployed container works with an empty Neon database without
  // anyone having to run `npm run migrate` by hand.
  try {
    await require('./lib/ensureSchema')(pool);
    lastError = null;
  } catch (err) {
    lastError = `Connected, but applying the schema failed: ${safeMessage(err)}`;
    console.error('❌', lastError);
  }
  usingDB = true;
  const which = process.env.DATABASE_URL ? 'DATABASE_URL' : 'DB_* vars';
  console.log(`✅ PostgreSQL connected (${which}) — using database`);
}

async function connectWithRetry() {
  const delays = [0, 3000, 6000, 10000];            // initial attempts
  for (let i = 0; i < delays.length; i++) {
    if (delays[i]) await sleep(delays[i]);
    try {
      await connectOnce();
      return true;
    } catch (err) {
      lastError = safeMessage(err);
      console.log(`⚠️  PostgreSQL connection attempt ${i + 1}/${delays.length} failed: ${lastError}`);
    }
  }
  return false;
}

(async () => {
  if (!hasDbConfig) {
    lastError = 'DATABASE_URL is not set in this service\'s environment.';
    console.log('⚠️  DATABASE_URL is not set — using in-memory store (nothing is saved).');
    console.log('   Add DATABASE_URL (your Neon connection string) as a runtime variable on THIS service.');
    resolveReady();
    return;
  }
  const ok = await connectWithRetry();
  if (!ok) {
    console.log('⚠️  PostgreSQL not available yet — using in-memory store and retrying every 30s.');
    console.log(`   Reason: ${lastError}`);
  }
  resolveReady();

  // Keep trying in the background: once Neon becomes reachable the app
  // switches over to it without a restart, and makes sure an admin exists.
  while (!usingDB) {
    await sleep(30000);
    try {
      await connectOnce();
      try { await require('./bootstrapAdmin')(); } catch (e) { console.error('Admin bootstrap failed:', safeMessage(e)); }
    } catch (err) {
      lastError = safeMessage(err);
      console.log(`⚠️  PostgreSQL retry failed: ${lastError}`);
    }
  }
})();

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

  // Why it isn't (null when connected) — shown in the Admin Console and /healthz.
  lastError: () => (usingDB ? null : lastError),
  hasConfig: () => hasDbConfig,

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
