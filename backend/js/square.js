// ============================================================
// Headstart Education — Square Payments Client
// ============================================================
// Credentials are managed in the Admin Console (Square Settings tab) and
// stored in the `app_settings` table (access token encrypted). If nothing
// has been saved there, it falls back to environment variables so existing
// deployments keep working:
//   SQUARE_ACCESS_TOKEN   — secret token from the Square Developer Dashboard
//   SQUARE_LOCATION_ID    — the Location to take payments against
//   SQUARE_APPLICATION_ID — (optional) Application ID for the browser form
//   SQUARE_ENVIRONMENT    — "sandbox" (default) or "production"
//
// Settings are read on every call, so saving new credentials in the console
// takes effect immediately — no restart or redeploy needed.
//
// If no access token exists anywhere, `configured` is false and the
// donations route records a 'pending' donation without attempting a charge.
// ============================================================
require('dotenv').config();
const settings = require('./lib/settings');

let sdk = null;
let sdkError = null;
try {
  // eslint-disable-next-line global-require
  sdk = require('square');
} catch (err) {
  sdkError = err.message;
  console.log('⚠️  Could not load the Square SDK:', err.message);
  console.log('   Run `npm install` inside backend/js to install the "square" package.');
}

let memo = { key: null, client: null };

function buildClient(token, environment) {
  if (!sdk || !token) return null;
  const key = `${environment}:${token}`;
  if (memo.key === key) return memo.client;
  const client = new sdk.SquareClient({
    token,
    environment: environment === 'production' ? sdk.SquareEnvironment.Production : sdk.SquareEnvironment.Sandbox,
  });
  memo = { key, client };
  return client;
}

// Resolves the effective config: console-saved value first, then env var.
async function getConfig() {
  const saved = await settings.getAll('square.');
  const pick = (savedValue, envValue) => {
    if (savedValue) return { value: savedValue, source: 'console' };
    if (envValue) return { value: envValue, source: 'env' };
    return { value: null, source: null };
  };
  const app   = pick(saved['square.application_id'], process.env.SQUARE_APPLICATION_ID);
  const loc   = pick(saved['square.location_id'], process.env.SQUARE_LOCATION_ID);
  const token = pick(saved['square.access_token'], process.env.SQUARE_ACCESS_TOKEN);
  const envName = pick(saved['square.environment'], process.env.SQUARE_ENVIRONMENT);
  const environment = envName.value === 'production' ? 'production' : 'sandbox';
  return {
    applicationId: app.value,
    locationId: loc.value,
    accessToken: token.value,
    environment,
    sources: { applicationId: app.source, locationId: loc.source, accessToken: token.source, environment: envName.source },
  };
}

// Config plus a ready-to-use client. `configured` means we can take a real charge.
async function load() {
  const cfg = await getConfig();
  const client = buildClient(cfg.accessToken, cfg.environment);
  return { ...cfg, client, configured: !!(client && cfg.locationId), sdkError };
}

function describeError(err) {
  // Prefer Square's own human-readable detail when it gives one.
  const details = (err?.errors || [])
    .map((e) => e.detail || (e.code && e.code !== 'Unknown' ? e.code : null))
    .filter(Boolean);
  if (details.length) return details.join(' ');
  if (err?.statusCode === 401) {
    return 'Square rejected the access token (401). Check it matches the selected environment (Sandbox vs Production).';
  }
  if (err?.statusCode === 403 && /allowlist|egress/i.test(err?.message || '')) {
    return 'This server is not allowed to reach Square (network egress is blocked).';
  }
  return err?.message || 'Square request failed.';
}

// Calls Square's Locations API with the saved credentials — the quickest
// way to prove the token, environment and location id all line up.
async function testConnection() {
  const sq = await load();
  if (!sq.client) {
    throw new Error(sdkError ? `Square SDK not installed: ${sdkError}` : 'No access token saved yet.');
  }
  let response;
  try {
    response = await sq.client.locations.list();
  } catch (err) {
    throw new Error(describeError(err));
  }
  const locations = (response.locations || response.result?.locations || []).map((l) => ({
    id: l.id, name: l.name, status: l.status,
  }));
  const match = sq.locationId ? locations.find((l) => l.id === sq.locationId) : null;
  return { environment: sq.environment, locations, locationFound: !!match, locationName: match?.name || null, locationId: sq.locationId };
}

module.exports = { getConfig, load, testConnection, describeError };
