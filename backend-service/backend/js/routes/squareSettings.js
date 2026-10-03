// ============================================================
// Headstart Education — Square Settings
// GET  /api/square/public-config — public IDs the donate form needs (no secrets)
// GET  /api/square/settings      — current settings, token masked   (super admin)
// PUT  /api/square/settings      — save credentials                 (super admin)
// POST /api/square/test          — verify saved credentials         (super admin)
// ============================================================
const express  = require('express');
const router   = express.Router();
const square   = require('../square');
const settings = require('../lib/settings');
const { requireSuperAdmin } = require('../lib/auth');
const { logAudit } = require('./adminAuth');

// Public: only identifiers that are already visible in the browser anyway.
router.get('/public-config', async (req, res) => {
  try {
    const sq = await square.load();
    res.json({
      configured: !!(sq.configured && sq.applicationId),
      applicationId: sq.applicationId,
      locationId: sq.locationId,
      environment: sq.environment,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/settings', requireSuperAdmin, async (req, res) => {
  try {
    const cfg = await square.getConfig();
    res.json({
      environment: cfg.environment,
      applicationId: cfg.applicationId || '',
      locationId: cfg.locationId || '',
      accessTokenSet: !!cfg.accessToken,
      accessTokenLast4: cfg.accessToken ? cfg.accessToken.slice(-4) : null,
      sources: cfg.sources,   // 'console' | 'env' | null per field
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/settings', requireSuperAdmin, async (req, res) => {
  try {
    const { environment, applicationId, locationId, accessToken, clearAccessToken } = req.body || {};

    if (environment !== 'sandbox' && environment !== 'production') {
      return res.status(400).json({ message: 'Environment must be "sandbox" or "production"' });
    }
    const appId = String(applicationId || '').trim();
    const locId = String(locationId || '').trim();
    const token = String(accessToken || '').trim();

    if (environment === 'production' && appId.startsWith('sandbox-')) {
      return res.status(400).json({ message: 'That is a Sandbox Application ID — it cannot be used with the Production environment.' });
    }
    if (environment === 'sandbox' && appId && !appId.startsWith('sandbox-')) {
      return res.status(400).json({ message: 'That looks like a Production Application ID — switch Environment to Production, or enter your Sandbox Application ID.' });
    }

    const entries = {
      'square.environment':    { value: environment },
      'square.application_id': { value: appId },
      'square.location_id':    { value: locId },
    };
    // Blank token = keep the one already saved (the form never receives it back).
    if (clearAccessToken) entries['square.access_token'] = { value: null };
    else if (token) entries['square.access_token'] = { value: token, secret: true };

    await settings.setMany(entries, req.admin.username);
    await logAudit(req.admin, 'square.settings_update', JSON.stringify({
      environment, applicationId: appId, locationId: locId,
      accessToken: clearAccessToken ? 'cleared' : (token ? 'updated' : 'unchanged'),
    }));
    res.json({ message: 'Square settings saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/test', requireSuperAdmin, async (req, res) => {
  try {
    res.json(await square.testConnection());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
