// ============================================================
// Headstart Education — Groq AI Settings (super admin)
// GET  /api/groq/settings — current settings, key masked
// PUT  /api/groq/settings — save API key / model
// GET  /api/groq/models   — models available to the saved key
// POST /api/groq/test     — make a tiny test request
// ============================================================
const express  = require('express');
const router   = express.Router();
const groq     = require('../lib/groq');
const settings = require('../lib/settings');
const { requireSuperAdmin } = require('../lib/auth');
const { logAudit } = require('./adminAuth');

router.use(requireSuperAdmin);

router.get('/settings', async (req, res) => {
  try {
    const c = await groq.getConfig();
    res.json({
      model: c.model, apiKeySet: !!c.apiKey, apiKeyLast4: c.apiKey ? c.apiKey.slice(-4) : null,
      sources: { apiKey: c.keySource, model: c.modelSource }, defaultModel: groq.DEFAULT_MODEL,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/settings', async (req, res) => {
  try {
    const { model, apiKey, clearApiKey } = req.body || {};
    const m = String(model || '').trim();
    const key = String(apiKey || '').trim();
    if (!m) return res.status(400).json({ message: 'Choose or enter a model name.' });
    if (!/^[A-Za-z0-9._\-\/:]+$/.test(m)) return res.status(400).json({ message: 'That model name has invalid characters.' });
    if (key && !key.startsWith('gsk_')) return res.status(400).json({ message: 'Groq API keys start with "gsk_". Check you copied the whole key.' });

    const entries = { 'groq.model': { value: m } };
    if (clearApiKey) entries['groq.api_key'] = { value: null };
    else if (key) entries['groq.api_key'] = { value: key, secret: true };
    await settings.setMany(entries, req.admin.username);
    await logAudit(req.admin, 'groq.settings_update', JSON.stringify({
      model: m, apiKey: clearApiKey ? 'cleared' : (key ? 'updated' : 'unchanged'),
    }));
    res.json({ message: 'Groq settings saved' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/models', async (req, res) => {
  try { res.json(await groq.listModels()); }
  catch (err) { res.status(400).json({ message: err.message }); }
});

router.post('/test', async (req, res) => {
  try { res.json(await groq.test()); }
  catch (err) { res.status(400).json({ message: err.message }); }
});

module.exports = router;
