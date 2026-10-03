// ============================================================
// Headstart Education — Default Admin Bootstrap
// ============================================================
// On startup, creates the first super admin login ONLY if the users table
// is completely empty (a brand-new install). Username/password come from
// ADMIN_USERNAME / ADMIN_PASSWORD in .env, falling back to admin / HSE$1 —
// change these in production!
//
// Once any user exists this does nothing, so removing or renaming the
// default account from the Users tab sticks across restarts.
// ============================================================
const db = require('./db');
const users = require('./lib/users');
const { hashPassword } = require('./lib/auth');

async function bootstrapAdmin() {
  await db.ready();

  if ((await users.count()) > 0) {
    console.log('👑 Users already exist — leaving them as they are.');
    return;
  }

  const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'HSE$1';

  await users.create({
    username,
    passwordHash: await hashPassword(password),
    name: 'Admin',
    role: 'superadmin',
    isActive: true,
  });

  const where = db.isConnected() ? '' : ' (in-memory — resets on restart)';
  console.log(`👑 Created default super admin: "${username}"${where}`);
  console.log('   ⚠️  Log in and change this password before going live.');
}

module.exports = bootstrapAdmin;
