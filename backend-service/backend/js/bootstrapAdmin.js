// ============================================================
// Headstart Education — Default Admin Bootstrap
// ============================================================
// On startup, creates a default admin login if no admin_users exist yet.
// Username/password come from ADMIN_USERNAME / ADMIN_PASSWORD in .env,
// falling back to admin / HSE$1 if not set — change these in production!
// Safe to run every startup: it's a no-op once an admin already exists.
// ============================================================
const db = require('./db');
const { hashPassword } = require('./lib/auth');

async function bootstrapAdmin() {
  await db.ready();

  const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'HSE$1';

  if (db.isConnected()) {
    const existing = await db.query('SELECT id FROM admin_users WHERE username = $1', [username]);
    if (existing.rows.length === 0) {
      const hash = await hashPassword(password);
      await db.query(
        `INSERT INTO admin_users (username, password_hash, name, role) VALUES ($1,$2,$3,'superadmin')`,
        [username, hash, 'Admin']
      );
      console.log(`👑 Created default admin login: "${username}" (see ADMIN_USERNAME/ADMIN_PASSWORD in .env)`);
      console.log('   ⚠️  Log in and change this password before going live.');
    } else {
      console.log(`👑 Admin login already exists ("${username}") — leaving it as is.`);
    }
    return;
  }

  // In-memory fallback
  if (!db.mem.adminUsers.find((a) => a.username === username)) {
    const hash = await hashPassword(password);
    db.mem.adminUsers.push({
      id: db.newId(),
      username,
      password_hash: hash,
      name: 'Admin',
      role: 'superadmin',
      created_at: new Date(),
    });
    console.log(`👑 Created default admin login: "${username}" (in-memory — resets on restart)`);
    console.log('   ⚠️  Set ADMIN_USERNAME/ADMIN_PASSWORD in .env to change these.');
  }
}

module.exports = bootstrapAdmin;
