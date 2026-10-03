// ============================================================
// Square Web Payments SDK — runtime configuration
// ============================================================
// The Application ID, Location ID and environment are managed by a super
// admin in Admin Console → Square Settings and fetched from the backend
// at runtime (GET /api/square/public-config) — nothing needs rebuilding
// when they change. They are PUBLIC identifiers; the secret access token
// never leaves the server.
//
// For backwards compatibility, if the backend has nothing configured the
// old build-time variables are still honoured as a fallback:
//   REACT_APP_SQUARE_APPLICATION_ID, REACT_APP_SQUARE_LOCATION_ID,
//   REACT_APP_SQUARE_ENVIRONMENT  ("sandbox" default | "production")
// ============================================================
import API_URL from './config';

const SDK_URLS = {
  sandbox:    'https://sandbox.web.squarecdn.com/v1/square.js',
  production: 'https://web.squarecdn.com/v1/square.js',
};

function envFallback() {
  const applicationId = process.env.REACT_APP_SQUARE_APPLICATION_ID || '';
  const locationId    = process.env.REACT_APP_SQUARE_LOCATION_ID || '';
  const usable = (v) => v && !v.includes('REPLACE_WITH');
  return {
    configured: !!(usable(applicationId) && usable(locationId)),
    applicationId,
    locationId,
    environment: process.env.REACT_APP_SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
  };
}

let configPromise = null;

// Resolves { configured, applicationId, locationId, environment }.
// Cached for the page's lifetime; pass { force: true } to re-fetch.
export function loadSquareConfig({ force = false } = {}) {
  if (!configPromise || force) {
    configPromise = fetch(`${API_URL}/api/square/public-config`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('config request failed'))))
      .then((cfg) => (cfg.configured ? cfg : (envFallback().configured ? envFallback() : cfg)))
      .catch(() => envFallback());
  }
  return configPromise;
}

// Injects the correct SDK <script> (sandbox vs production) the first time
// it's needed, so switching environment in the console just works.
function loadSdk(environment) {
  if (window.Square) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_URLS[environment] || SDK_URLS.sandbox;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Square.js failed to load. Check your internet connection and try again.'));
    document.head.appendChild(script);
  });
}

// Loads (or reuses) the Square payments object.
export async function getSquarePayments() {
  const cfg = await loadSquareConfig();
  if (!cfg.configured) {
    throw new Error('Online payments are not set up yet. Please contact giving@hseducation.org to donate.');
  }
  await loadSdk(cfg.environment);
  return window.Square.payments(cfg.applicationId, cfg.locationId);
}
