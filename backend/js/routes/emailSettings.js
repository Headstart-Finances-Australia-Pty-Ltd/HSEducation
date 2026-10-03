// ============================================================
// Headstart Education — System Email Settings
// GET  /api/email/settings — current settings, password masked (super admin)
// PUT  /api/email/settings — save SMTP settings                (super admin)
// POST /api/email/test     — verify login, optionally send a test message
// ============================================================
const express  = require('express');
const router   = express.Router();
const mailer   = require('../lib/mailer');
const settings = require('../lib/settings');
const { requireSuperAdmin } = require('../lib/auth');
const { logAudit } = require('./adminAuth');

router.use(requireSuperAdmin);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/settings', async (req, res) => {
  try {
    const c = await mailer.getConfig();
    res.json({
      host: c.host, port: c.port, secure: c.secure, user: c.user,
      passwordSet: !!c.password, passwordLast4: c.password ? c.password.slice(-4) : null,
      fromName: c.fromName, fromAddress: c.fromAddress, replyTo: c.replyTo,
      adminNotify: c.adminNotify, sendReceipts: c.sendReceipts, notifyAdmin: c.notifyAdmin,
      configured: c.configured, sources: c.sources,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const b = req.body || {};
    const host = String(b.host || '').trim();
    const port = parseInt(b.port, 10);
    const fromAddress = String(b.fromAddress || '').trim();
    const replyTo = String(b.replyTo || '').trim();
    const adminNotify = String(b.adminNotify || '').trim();
    const password = String(b.password || '');

    if (!host) return res.status(400).json({ message: 'SMTP host is required.' });
    if (!port || port < 1 || port > 65535) return res.status(400).json({ message: 'Enter a valid port (usually 587 or 465).' });
    if (fromAddress && !EMAIL_RE.test(fromAddress)) return res.status(400).json({ message: '"From" address is not a valid email.' });
    if (replyTo && !EMAIL_RE.test(replyTo)) return res.status(400).json({ message: 'Reply-to address is not a valid email.' });
    if (adminNotify && !EMAIL_RE.test(adminNotify)) return res.status(400).json({ message: 'Notification address is not a valid email.' });

    const entries = {
      'email.host':         { value: host },
      'email.port':         { value: String(port) },
      'email.secure':       { value: b.secure ? 'true' : 'false' },
      'email.user':         { value: String(b.user || '').trim() },
      'email.from_name':    { value: String(b.fromName || '').trim() },
      'email.from_address': { value: fromAddress },
      'email.reply_to':     { value: replyTo },
      'email.admin_notify': { value: adminNotify },
      'email.send_receipts':{ value: b.sendReceipts ? 'true' : 'false' },
      'email.notify_admin': { value: b.notifyAdmin ? 'true' : 'false' },
    };
    // Blank password = keep the saved one (the form never receives it back).
    if (b.clearPassword) entries['email.password'] = { value: null };
    else if (password) entries['email.password'] = { value: password, secret: true };

    await settings.setMany(entries, req.admin.username);
    await logAudit(req.admin, 'email.settings_update', JSON.stringify({
      host, port, user: entries['email.user'].value, fromAddress,
      password: b.clearPassword ? 'cleared' : (password ? 'updated' : 'unchanged'),
    }));
    res.json({ message: 'Email settings saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/test', async (req, res) => {
  try {
    const to = String((req.body || {}).to || '').trim();
    const conn = await mailer.verify();
    if (!to) return res.json({ ...conn, sent: false });
    if (!EMAIL_RE.test(to)) return res.status(400).json({ message: 'Enter a valid email address to send the test to.' });
    await mailer.send({
      to,
      subject: 'Headstart Education — test email',
      text: 'This is a test email from the Headstart Education Admin Console. Your email settings are working.',
    });
    await logAudit(req.admin, 'email.test_sent', to);
    res.json({ ...conn, sent: true, to });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
