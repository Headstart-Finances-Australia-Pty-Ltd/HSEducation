// ============================================================
// Headstart Education — Donations Routes
// Works with PostgreSQL or in-memory fallback automatically
// POST   /api/donations       — submit a donation (charges via Square)
// GET    /api/donations       — list donations
// GET    /api/donations/:id   — single donation
// PATCH  /api/donations/:id/status — update status
// ============================================================
const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();
const db      = require('../db');
const square  = require('../square');
const mailer  = require('../lib/mailer');
const { requireAdmin, requireStaff } = require('../lib/auth');

// Looks up the 'square' provider's id, creating it on first use if the
// seed data hasn't been loaded (e.g. fresh database).
async function getSquareProviderId() {
  if (db.isConnected()) {
    const existing = await db.query(`SELECT id FROM providers WHERE type='square' LIMIT 1`);
    if (existing.rows.length) return existing.rows[0].id;
    const created = await db.query(
      `INSERT INTO providers (name, type, is_active) VALUES ('Square', 'square', true) RETURNING id`
    );
    return created.rows[0].id;
  }
  let p = db.mem.providers.find((x) => x.type === 'square');
  if (!p) {
    p = { id: db.newId(), name: 'Square', type: 'square', is_active: true, created_at: new Date() };
    db.mem.providers.push(p);
  }
  return p.id;
}

// Charges a tokenized card/bank nonce via the Square Payments API.
// Returns { success, paymentId, status, error }.
async function chargeWithSquare({ sourceId, amount, currency, email }) {
  // Credentials come from the Admin Console (or env fallback) — see square.js.
  const sq = await square.load();
  if (!sq.client) {
    return { success: false, skipped: true, error: 'Square is not configured on this server.' };
  }
  if (!sq.locationId) {
    return { success: false, skipped: true, error: 'Square Location ID is not set.' };
  }
  try {
    const response = await sq.client.payments.create({
      sourceId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)), // Square expects the smallest currency unit (cents)
        currency: currency || 'AUD',
      },
      locationId: sq.locationId,
      buyerEmailAddress: email || undefined,
    });
    // The Square SDK's response shape can vary slightly by version —
    // check the common locations for the created payment object.
    const payment = response.payment || response.result?.payment || response;
    return {
      success: true,
      paymentId: payment?.id || null,
      status: (payment?.status || 'COMPLETED').toLowerCase(),
    };
  } catch (err) {
    return { success: false, error: square.describeError(err) };
  }
}

// POST /api/donations
router.post('/', async (req, res) => {
  const { first_name, last_name, email, phone, amount, frequency, program_id, sourceId } = req.body;
  if (!first_name || !email || !amount) {
    return res.status(400).json({ error: 'first_name, email and amount are required' });
  }

  const parsedAmount = parseFloat(amount);
  const providerId = await getSquareProviderId();

  // Charge via Square if we have a token and Square is configured.
  // (frequency 'monthly'/'annually' currently charge once immediately —
  // see README "Square Payments Setup" for notes on recurring billing.)
  let paymentResult = { success: false, skipped: true };
  if (sourceId) {
    paymentResult = await chargeWithSquare({ sourceId, amount: parsedAmount, currency: 'AUD', email });
  }

  const status = paymentResult.success
    ? 'completed'
    : (paymentResult.skipped ? 'pending' : 'failed');

  if (!paymentResult.success && !paymentResult.skipped) {
    // A real Square decline/error — don't pretend it worked.
    return res.status(402).json({ error: paymentResult.error || 'Payment could not be processed.' });
  }

  try {
    if (db.isConnected()) {
      const result = await db.query(
        `INSERT INTO donations (first_name,last_name,email,phone,amount,frequency,program_id,provider_id,transaction_id,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [first_name, last_name, email, phone || null, parsedAmount,
         frequency || 'once', program_id || null, providerId,
         paymentResult.paymentId || null, status]
      );
      mailer.sendDonationEmails(result.rows[0]); // fire-and-forget
      return res.status(201).json({ success: true, donation: result.rows[0], square: paymentResult });
    }
    // In-memory
    const donation = {
      id: db.newId(), first_name, last_name, email,
      phone: phone || null, amount: parsedAmount,
      frequency: frequency || 'once',
      program_id: program_id || null,
      provider_id: providerId,
      transaction_id: paymentResult.paymentId || null,
      status,
      is_tax_receipt_sent: false,
      created_at: new Date(),
    };
    db.mem.donations.push(donation);
    mailer.sendDonationEmails(donation);
    return res.status(201).json({ success: true, donation, square: paymentResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/donations — admin only (contains donor PII)
router.get('/', requireStaff, async (req, res) => {
  try {
    if (db.isConnected()) {
      const result = await db.query(
        `SELECT d.*, p.name AS program_name FROM donations d
         LEFT JOIN programs p ON d.program_id = p.id
         ORDER BY d.created_at DESC LIMIT 200`
      );
      return res.json(result.rows);
    }
    res.json(db.mem.donations.slice().reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/donations/:id — admin only
router.get('/:id', requireStaff, async (req, res) => {
  try {
    if (db.isConnected()) {
      const result = await db.query('SELECT * FROM donations WHERE id=$1', [req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      return res.json(result.rows[0]);
    }
    const d = db.mem.donations.find(x => x.id === req.params.id);
    if (!d) return res.status(404).json({ error: 'Not found' });
    res.json(d);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/donations/:id/status — admin only
router.patch('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending','completed','failed','refunded'];
  if (!allowed.includes(status)) return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  try {
    if (db.isConnected()) {
      const result = await db.query(
        'UPDATE donations SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
        [status, req.params.id]
      );
      return res.json(result.rows[0]);
    }
    const d = db.mem.donations.find(x => x.id === req.params.id);
    if (!d) return res.status(404).json({ error: 'Not found' });
    d.status = status;
    res.json(d);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
