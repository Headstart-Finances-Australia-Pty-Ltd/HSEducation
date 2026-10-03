// ============================================================
// Headstart Education — Square Payments Client
// ============================================================
// Reads credentials from environment variables (see .env.example):
//   SQUARE_ACCESS_TOKEN   — secret token from the Square Developer Dashboard
//   SQUARE_LOCATION_ID    — the Location to take payments against
//   SQUARE_ENVIRONMENT    — "sandbox" (default) or "production"
//
// If SQUARE_ACCESS_TOKEN is not set, `isConfigured()` returns false and
// the donations route falls back to recording a 'pending' donation
// without attempting a real charge, so the app still runs out of the box
// for local development/demo purposes.
// ============================================================
require('dotenv').config();

let client = null;
let configured = false;

try {
  if (process.env.SQUARE_ACCESS_TOKEN) {
    // eslint-disable-next-line global-require
    const { SquareClient, SquareEnvironment } = require('square');
    client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment:
        process.env.SQUARE_ENVIRONMENT === 'production'
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });
    configured = true;
    console.log(`✅ Square payments configured (${process.env.SQUARE_ENVIRONMENT || 'sandbox'})`);
  } else {
    console.log('⚠️  SQUARE_ACCESS_TOKEN not set — donations will be recorded as "pending" without a live charge.');
    console.log('   See backend/js/.env.example to configure Square.');
  }
} catch (err) {
  console.log('⚠️  Could not initialise the Square SDK:', err.message);
  console.log('   Run `npm install` inside backend/js to install the "square" package.');
}

module.exports = {
  client,
  isConfigured: () => configured,
  locationId: () => process.env.SQUARE_LOCATION_ID || null,
};
