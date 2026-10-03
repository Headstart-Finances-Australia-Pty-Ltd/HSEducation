// ============================================================
// Headstart Education — Unified Server
// Serves React frontend AND API from one Express server
// Single port (3000) — one Northflank service
// ============================================================
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const path         = require('path');
const fs           = require('fs');

const donationsRouter   = require('./routes/donations');
const programsRouter    = require('./routes/programs');
const providersRouter   = require('./routes/providers');
const { router: adminAuthRouter } = require('./routes/adminAuth');
const usersRouter       = require('./routes/users');
const squareRouter      = require('./routes/squareSettings');
const dbTablesRouter    = require('./routes/dbTables');
const bootstrapAdmin    = require('./bootstrapAdmin');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
// credentials: true is required so the browser will send/receive the
// admin session cookie — matters most in local dev where the CRA dev
// server and the API can be on different origins/ports.
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('tiny'));

// ── API Routes ────────────────────────────────────────────
app.get('/healthz', (req, res) => {
  const db = require('./db');
  res.json({
    status:   'ok',
    service:  'Headstart Education',
    database: db.isConnected() ? 'postgresql' : 'in-memory',
    port:     PORT,
  });
});

app.use('/api/admin-auth',  adminAuthRouter);
app.use('/api/users',       usersRouter);
app.use('/api/square',      squareRouter);
app.use('/api/db-tables',   dbTablesRouter);
app.use('/api/donations',   donationsRouter);
app.use('/api/programs',    programsRouter);
app.use('/api/providers',   providersRouter);

// ── Serve React Frontend ──────────────────────────────────
// The React build is copied into /app/public inside the container
const STATIC = path.join(__dirname, 'public');

if (fs.existsSync(STATIC)) {
  // Serve static assets
  app.use(express.static(STATIC));
  // All other routes → React index.html (SPA routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(STATIC, 'index.html'));
  });
  console.log('✅ Serving React frontend from /public');
} else {
  app.get('/', (req, res) => res.json({ message: 'Headstart Education API running' }));
  console.log('⚠️  No frontend build found — API only mode');
}

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║   Headstart Education - Running!     ║');
  console.log(`║   Port    : ${PORT}                      ║`);
  console.log('║   Website : /                        ║');
  console.log('║   API     : /api/programs            ║');
  console.log('║   Admin   : /api/admin-auth/login    ║');
  console.log('║   Health  : /healthz                 ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  try {
    await bootstrapAdmin();
  } catch (err) {
    console.error('⚠️  Could not bootstrap default admin user:', err.message);
  }
});

module.exports = app;
