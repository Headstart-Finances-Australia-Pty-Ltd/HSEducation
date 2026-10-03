// ============================================================
// Headstart Education — AI-assisted email to donors / members / partners
// GET  /api/mail/audiences            — recipient counts + setup status
// POST /api/mail/draft                — Groq writes a subject + body
// POST /api/mail/send                 — send (or test-send) via system email
// GET  /api/mail/history              — past sends
// GET|POST /api/mail/unsubscribe      — public one-click unsubscribe
// Draft/send: admin or super admin. Nothing is sent without a human
// pressing Send — the AI only writes a draft.
// ============================================================
const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const groq     = require('../lib/groq');
const mailer   = require('../lib/mailer');
const contacts = require('../lib/contacts');
const { requireAdmin } = require('../lib/auth');
const { logAudit } = require('./adminAuth');

const AUDIENCES = { donors: 'donors', members: 'members', partners: 'partners' };
const MAX_RECIPIENTS = 500;
const TONES = ['warm and grateful', 'professional', 'formal', 'friendly and casual', 'celebratory', 'urgent but respectful'];
const LENGTHS = { short: 'about 80–120 words', medium: 'about 150–220 words', long: 'about 250–350 words' };
const AUDIENCE_GUIDE = {
  donors: 'The reader has donated to Headstart Education. Thank them, show what donations make possible, and keep the focus on the children and schools. Never pressure them to give more.',
  members: 'The reader is a member of the Headstart Education community. Share news, invite involvement, and keep a community feel.',
  partners: 'The reader is a partner organisation or potential partner (school, company, community group). Be professional, respectful of their time, and clear about the collaboration or next step.',
};

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clip = (v, n) => String(v || '').trim().slice(0, n);

function publicBase(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.get('host')).split(',')[0].trim();
  return `${proto === 'http' || proto === 'https' ? proto : 'https'}://${host}`;
}

// {{first_name}}, {{name}}, {{organisation}} — anything else is removed.
function personalise(text, p) {
  const vals = { first_name: p.first_name || 'friend', name: p.name || 'friend', organisation: p.organisation || 'your organisation' };
  return String(text).replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k) => vals[k.toLowerCase()] ?? '');
}

function bodyToHtml(text) {
  return text.split(/\n{2,}/).map((para) => `<p style="margin:0 0 14px;line-height:1.6">${esc(para).replace(/\n/g, '<br>')}</p>`).join('');
}

function buildMessage(person, subject, body, unsubUrl, audienceLabel, mailto) {
  const text = personalise(body, person);
  const footerText = `\n\n—\nYou're receiving this because you're a ${audienceLabel} of Headstart Education.\nUnsubscribe: ${unsubUrl}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;max-width:600px">${bodyToHtml(text)}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 12px">
<p style="font-size:12px;color:#6b7280;line-height:1.5">You're receiving this because you're a ${esc(audienceLabel)} of Headstart Education.<br><a href="${esc(unsubUrl)}" style="color:#6b7280">Unsubscribe</a></p></div>`;
  return {
    to: person.email,
    subject: personalise(subject, person),
    text: text + footerText,
    html,
    headers: { 'List-Unsubscribe': `<${unsubUrl}>${mailto ? `, <mailto:${mailto}?subject=unsubscribe>` : ''}`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  };
}

// ── Send log (DB or memory) ────────────────────────────────
const memLog = () => { if (!db.mem.emailLog) db.mem.emailLog = []; return db.mem.emailLog; };
async function logCreate(row) {
  if (db.isConnected()) {
    const { rows } = await db.query(
      `INSERT INTO email_log (audience,subject,body,total,ai_drafted,sent_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [row.audience, row.subject, row.body, row.total, row.ai_drafted, row.sent_by]);
    return rows[0].id;
  }
  const id = db.newId();
  memLog().push({ id, ...row, sent_count: 0, failed_count: 0, status: 'sending', last_error: null, created_at: new Date(), finished_at: null });
  return id;
}
async function logProgress(id, sentDelta, failedDelta, lastError) {
  if (db.isConnected()) {
    await db.query(`UPDATE email_log SET sent_count=sent_count+$2, failed_count=failed_count+$3, last_error=COALESCE($4,last_error) WHERE id=$1`, [id, sentDelta, failedDelta, lastError || null]);
  } else {
    const r = memLog().find((x) => x.id === id);
    if (r) { r.sent_count += sentDelta; r.failed_count += failedDelta; if (lastError) r.last_error = lastError; }
  }
}
async function logFinish(id, status) {
  if (db.isConnected()) await db.query(`UPDATE email_log SET status=$2, finished_at=NOW() WHERE id=$1`, [id, status]);
  else { const r = memLog().find((x) => x.id === id); if (r) { r.status = status; r.finished_at = new Date(); } }
}
async function logList() {
  if (db.isConnected()) {
    const { rows } = await db.query(
      `SELECT id,audience,subject,body,total,sent_count,failed_count,status,last_error,ai_drafted,sent_by,created_at,finished_at
       FROM email_log ORDER BY created_at DESC LIMIT 50`);
    return rows;
  }
  return memLog().slice().reverse().slice(0, 50);
}

// ── Public: unsubscribe ────────────────────────────────────
async function handleUnsubscribe(req, res) {
  const email = contacts.norm(req.query.e);
  const ok = contacts.verifyUnsubToken(email, req.query.t);
  const page = (title, msg) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center">
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:2rem;max-width:440px;margin:1rem;text-align:center">
<h2 style="color:#0f2744;margin-top:0">${esc(title)}</h2><p style="color:#4b5563;line-height:1.6">${esc(msg)}</p></div></body></html>`;
  if (!ok) return res.status(400).send(page('Link not valid', 'This unsubscribe link is invalid or incomplete. Please reply to any of our emails and we will remove you.'));
  try {
    await contacts.unsubscribe(email);
    res.send(page('You have been unsubscribed', `${email} will no longer receive emails from Headstart Education.`));
  } catch (err) {
    console.error('UNSUBSCRIBE ERROR:', err.message);
    res.status(500).send(page('Something went wrong', 'We could not process that right now. Please try again later or reply to any of our emails.'));
  }
}
router.get('/unsubscribe', handleUnsubscribe);
router.post('/unsubscribe', handleUnsubscribe);   // RFC 8058 one-click

// Everything below needs an admin session.
router.use(requireAdmin);

router.get('/audiences', async (req, res) => {
  try {
    const [counts, mail, ai] = await Promise.all([contacts.counts(), mailer.getConfig(), groq.getConfig()]);
    res.json({ counts, emailConfigured: mail.configured, groqConfigured: ai.configured, model: ai.model,
      tones: TONES, lengths: Object.keys(LENGTHS), maxRecipients: MAX_RECIPIENTS });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/draft', async (req, res) => {
  try {
    const b = req.body || {};
    const audience = AUDIENCES[b.audience];
    if (!audience) return res.status(400).json({ message: 'Choose who the email is for.' });
    const brief = clip(b.brief, 1500);
    if (brief.length < 10) return res.status(400).json({ message: 'Describe what the email should say (at least a sentence).' });
    const tone = TONES.includes(b.tone) ? b.tone : TONES[0];
    const length = LENGTHS[b.length] ? b.length : 'medium';
    const details = clip(b.details, 2000);
    const sender = clip(b.signOff, 120) || 'The Headstart Education Team';

    const system = [
      'You write emails on behalf of Headstart Education Australia, a newly established Australian charity that provides classroom infrastructure and learning materials directly to disadvantaged schools. Its first project is at a rural school in Uttar Pradesh, India, and is still in development.',
      AUDIENCE_GUIDE[audience],
      'RULES:',
      '- Use ONLY facts given in the brief or key details. Never invent statistics, dollar amounts, dates, names, events, results or promises.',
      '- Do not claim tax-deductibility, ACNC status details, or receipts unless the brief says so.',
      '- Plain text only — no markdown, no asterisks, no bullet symbols other than simple hyphens, no emojis.',
      '- Start the body with a greeting that uses the placeholder {{first_name}} exactly (e.g. "Dear {{first_name}},"). You may also use {{name}} and {{organisation}}. Use no other placeholders.',
      `- Tone: ${tone}. Length: ${LENGTHS[length]}.`,
      `- End with a short sign-off from: ${sender}.`,
      '- Subject line: under 70 characters, specific, no clickbait, no ALL CAPS.',
      'Respond with ONLY a JSON object: {"subject": "...", "body": "..."}. Use \\n for line breaks inside body.',
    ].join('\n');
    const user = `Audience: ${audience}\nWhat the email should say:\n${brief}${details ? `\n\nKey facts to include (use exactly as given):\n${details}` : ''}`;

    const raw = await groq.chat({ system, user, json: true, temperature: 0.6, maxTokens: 1000 });
    let subject = '', body = '';
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(m ? m[0] : raw);
      subject = String(parsed.subject || '').trim();
      body = String(parsed.body || '').trim();
    } catch {
      // Model ignored JSON format — salvage "Subject: …" + rest.
      const mm = raw.match(/^\s*subject:\s*(.+)$/im);
      subject = mm ? mm[1].trim() : '';
      body = raw.replace(/^\s*subject:.*$/im, '').trim();
    }
    if (!body) return res.status(502).json({ message: 'The AI returned an empty draft. Try again, or add more detail to the brief.' });
    if (!/\{\{\s*first_name\s*\}\}/i.test(body)) body = `Dear {{first_name}},\n\n${body}`;
    res.json({ subject: subject || 'A message from Headstart Education', body, model: (await groq.getConfig()).model });
  } catch (err) {
    res.status(502).json({ message: err.message });
  }
});

router.post('/send', async (req, res) => {
  try {
    const b = req.body || {};
    const audience = AUDIENCES[b.audience];
    if (!audience) return res.status(400).json({ message: 'Choose who the email is for.' });
    const subject = clip(b.subject, 200);
    const body = String(b.body || '').trim().slice(0, 10000);
    if (!subject) return res.status(400).json({ message: 'Add a subject line.' });
    if (body.length < 20) return res.status(400).json({ message: 'The email body is too short.' });

    const mail = await mailer.getConfig();
    if (!mail.configured) return res.status(400).json({ message: 'System email is not set up yet — a super admin must complete Admin Console → API Key Settings → Email.' });

    const base = publicBase(req);
    const label = audience.slice(0, -1);   // donor | member | partner
    const mailto = mail.replyTo || mail.fromAddress || '';
    const unsub = (email) => `${base}/api/mail/unsubscribe?e=${encodeURIComponent(email)}&t=${contacts.unsubToken(email)}`;

    // ── Test send: one message to the address given, nothing logged as a campaign.
    if (b.testTo) {
      const to = contacts.norm(b.testTo);
      if (!contacts.EMAIL_RE.test(to)) return res.status(400).json({ message: 'Enter a valid email address for the test.' });
      const sample = { first_name: 'Alex', name: 'Alex Sample', organisation: 'Sample Organisation', email: to };
      const msg = buildMessage(sample, `[TEST] ${subject}`, body, unsub(to), label, mailto);
      await mailer.send(msg);
      await logAudit(req.admin, 'mail.test_send', to);
      return res.json({ test: true, to });
    }

    const people = await contacts.audience(audience);
    if (!people.length) return res.status(400).json({ message: `There are no subscribed ${audience} to email.` });
    if (people.length > MAX_RECIPIENTS) return res.status(400).json({ message: `That is ${people.length} recipients — the limit is ${MAX_RECIPIENTS} per send to protect your mail provider's limits.` });
    if (Number(b.expectedCount) !== people.length) {
      return res.status(409).json({ message: `The ${audience} list changed (now ${people.length} recipients). Please review and press Send again.`, count: people.length });
    }

    const id = await logCreate({ audience, subject, body, total: people.length, ai_drafted: !!b.aiDrafted, sent_by: req.admin.username });
    await logAudit(req.admin, 'mail.send', `${audience}: ${people.length} recipients — ${subject}`);
    res.status(202).json({ id, total: people.length });

    // Background send — the browser polls /history for progress.
    (async () => {
      try {
        const messages = people.map((p) => buildMessage(p, subject, body, unsub(p.email), label, mailto));
        let failures = 0;
        await mailer.sendBatch(messages, async (i, error) => {
          if (error) { failures++; await logProgress(id, 0, 1, `${people[i].email}: ${error}`); }
          else await logProgress(id, 1, 0, null);
        });
        await logFinish(id, failures === people.length ? 'failed' : 'done');
      } catch (err) {
        console.error('BULK SEND ERROR:', err.message);
        await logProgress(id, 0, 0, err.message).catch(() => {});
        await logFinish(id, 'failed').catch(() => {});
      }
    })();
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/history', async (req, res) => {
  try { res.json(await logList()); } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
