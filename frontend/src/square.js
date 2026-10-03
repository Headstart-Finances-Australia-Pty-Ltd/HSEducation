// ============================================================
// Square Web Payments SDK — configuration
// ============================================================
// Set these in a .env file at frontend/.env (see .env.example).
// They are PUBLIC identifiers — safe to ship in the frontend bundle.
// The SECRET access token lives only on the backend (backend/js/.env).
//
//   REACT_APP_SQUARE_APPLICATION_ID = your Square Application ID
//   REACT_APP_SQUARE_LOCATION_ID    = your Square Location ID
//
// Get both from the Square Developer Dashboard: https://developer.squareup.com/apps
// Use the "Sandbox" values while testing (they start with "sandbox-sq0idb-").
// ============================================================

export const SQUARE_APPLICATION_ID =
  process.env.REACT_APP_SQUARE_APPLICATION_ID || 'sandbox-sq0idb-REPLACE_WITH_YOUR_APP_ID';

export const SQUARE_LOCATION_ID =
  process.env.REACT_APP_SQUARE_LOCATION_ID || 'REPLACE_WITH_YOUR_LOCATION_ID';

// Becomes true once real-looking credentials have been configured.
// Used to show a friendly setup notice instead of a confusing SDK error.
export const isSquareConfigured =
  !SQUARE_APPLICATION_ID.includes('REPLACE_WITH') &&
  !SQUARE_LOCATION_ID.includes('REPLACE_WITH');

// Loads (or reuses) the Square payments object.
// Requires the Square Web Payments SDK <script> tag in public/index.html.
export async function getSquarePayments() {
  if (!window.Square) {
    throw new Error('Square.js failed to load. Check your internet connection and that the Square <script> tag is present in index.html.');
  }
  return window.Square.payments(SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID);
}
