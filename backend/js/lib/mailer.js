// ============================================================
// Headstart Education — Mailer (system email)
// SMTP settings are managed in Admin Console → "API Key Settings → Email" and stored
// in app_settings (password encrypted). Environment variables are only a
// fallback: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD,
// EMAIL_FROM_NAME, EMAIL_FROM_ADDRESS, EMAIL_REPLY_TO, EMAIL_ADMIN_NOTIFY.
// Read on every send, so changes apply immediately — no restart.
// ============================================================
const settings = require('./settings');

let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch (e) { /* reported in send() */ }

const bool = (v, dflt) => (v === undefined || v === null || v === '' ? dflt : String(v) === 'true');

async function getConfig() {
  const saved = await settings.getAll('email.');
  const pick = (k, envVal) => {
    const v = saved[`email.${k}`];
    if (v !== undefined && v !== null && v !== '') return { value: v, source: 'console' };
    if (envVal) return { value: envVal, source: 'env' };
    return { value: null, source: null };
  };
  const host = pick('host', process.env.SMTP_HOST);
  const port = pick('port', process.env.SMTP_PORT);
  const secure = pick('secure', process.env.SMTP_SECURE);
  const user = pick('user', process.env.SMTP_USER);
  const password = pick('password', process.env.SMTP_PASSWORD);
  const fromName = pick('from_name', process.env.EMAIL_FROM_NAME);
  const fromAddress = pick('from_address', process.env.EMAIL_FROM_ADDRESS);
  const replyTo = pick('reply_to', process.env.EMAIL_REPLY_TO);
  const adminNotify = pick('admin_notify', process.env.EMAIL_ADMIN_NOTIFY);
  const portNum = parseInt(port.value, 10) || 587;
  return {
    host: host.value || '',
    port: portNum,
    // Port 465 = implicit TLS; 587/25/2525 = STARTTLS (upgraded automatically).
    // The port decides, so a mismatched SSL/TLS toggle can't cause the
    // "wrong version number" error. Only an unusual port honours the toggle.
    secure: portNum === 465 ? true
      : [587, 25, 2525].includes(portNum) ? false
      : (secure.value !== null ? String(secure.value) === 'true' : false),
    user: user.value || '',
    password: password.value || '',
    fromName: fromName.value || 'Headstart Education',
    fromAddress: fromAddress.value || '',
    replyTo: replyTo.value || '',
    adminNotify: adminNotify.value || '',
    sendReceipts: bool(saved['email.send_receipts'], true),
    notifyAdmin: bool(saved['email.notify_admin'], true),
    configured: !!(host.value && (fromAddress.value || user.value)),
    sources: {
      host: host.source, port: port.source, user: user.source, password: password.source,
      fromAddress: fromAddress.source,
    },
  };
}

function transportFor(cfg) {
  if (!nodemailer) {
    throw new Error('The "nodemailer" package is not installed on the server. Run `npm install` in backend/js (or redeploy).');
  }
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.password } : undefined,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

function describeError(err) {
  const msg = err && err.message ? err.message : String(err);
  if (/wrong version number|ssl3_get_record/i.test(msg)) return `SSL/TLS setting does not match the port. Use port 465 with SSL on, or port 587 with SSL off.`;
  if (/EAUTH|Invalid login|authentication/i.test(msg)) return `Login rejected by the mail server (${msg}). Check username/password — Gmail/Outlook need an app password.`;
  if (/ENOTFOUND|EAI_AGAIN/i.test(msg)) return `Could not find the mail server host (${msg}).`;
  if (/ECONNREFUSED|ETIMEDOUT|ESOCKET|timeout/i.test(msg)) return `Could not reach the mail server (${msg}). Check host, port and the SSL/TLS setting.`;
  return msg;
}

function fromHeader(cfg) {
  const addr = cfg.fromAddress || cfg.user;
  return cfg.fromName ? `"${cfg.fromName.replace(/"/g, '')}" <${addr}>` : addr;
}

// Throws on failure. Returns nodemailer's info object.
async function send({ to, subject, text, html, headers, replyTo }) {
  const cfg = await getConfig();
  if (!cfg.configured) throw new Error('Email is not configured. Add SMTP details in Admin Console → API Key Settings → Email.');
  try {
    return await transportFor(cfg).sendMail({
      from: fromHeader(cfg), to, subject, text, html,
      replyTo: replyTo || cfg.replyTo || undefined,
      headers,
    });
  } catch (err) {
    throw new Error(describeError(err));
  }
}

// Sends many messages over one pooled connection (bulk email). Calls
// onEach(index, error|null) after every message. Never throws per-message.
async function sendBatch(messages, onEach, { delayMs = 150 } = {}) {
  const cfg = await getConfig();
  if (!cfg.configured) throw new Error('Email is not configured. Add SMTP details in Admin Console → API Key Settings → Email.');
  if (!nodemailer) throw new Error('The "nodemailer" package is not installed on the server.');
  const transport = nodemailer.createTransport({
    host: cfg.host, port: cfg.port, secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.password } : undefined,
    pool: true, maxConnections: 2, maxMessages: 100,
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
  });
  try {
    for (let i = 0; i < messages.length; i++) {
      let error = null;
      try {
        await transport.sendMail({ from: fromHeader(cfg), replyTo: cfg.replyTo || undefined, ...messages[i] });
      } catch (err) {
        error = describeError(err);
      }
      await onEach(i, error);
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    }
  } finally {
    transport.close();
  }
}

// Verifies host/port/login without sending anything.
async function verify() {
  const cfg = await getConfig();
  if (!cfg.host) throw new Error('SMTP host is not set.');
  try {
    await transportFor(cfg).verify();
  } catch (err) {
    throw new Error(describeError(err));
  }
  return { host: cfg.host, port: cfg.port, secure: cfg.secure };
}

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Fire-and-forget helpers used by the donations route. Never throw.
async function sendDonationEmails(donation) {
  try {
    const cfg = await getConfig();
    if (!cfg.configured) return;
    const amount = Number(donation.amount).toFixed(2);
    const freq = donation.frequency && donation.frequency !== 'once' ? ` (${donation.frequency})` : '';
    const name = [donation.first_name, donation.last_name].filter(Boolean).join(' ');

    if (cfg.sendReceipts && donation.email && donation.status === 'completed') {
      await send({
        to: donation.email,
        subject: 'Thank you for your donation to Headstart Education',
        text: `Dear ${donation.first_name},\n\nThank you for your donation of $${amount} AUD${freq}. It will go directly toward classroom infrastructure and learning materials for children in need.\n\nReference: ${donation.transaction_id || donation.id}\n\nWith gratitude,\nHeadstart Education`,
        html: `<p>Dear ${esc(donation.first_name)},</p><p>Thank you for your donation of <strong>$${amount} AUD</strong>${esc(freq)}. It will go directly toward classroom infrastructure and learning materials for children in need.</p><p style="color:#666">Reference: ${esc(donation.transaction_id || donation.id)}</p><p>With gratitude,<br>Headstart Education</p>`,
      });
    }
    if (cfg.notifyAdmin && cfg.adminNotify) {
      await send({
        to: cfg.adminNotify,
        subject: `New donation: $${amount} from ${name || donation.email}`,
        text: `A new donation was received.\n\nDonor: ${name}\nEmail: ${donation.email}\nPhone: ${donation.phone || '-'}\nAmount: $${amount} AUD${freq}\nStatus: ${donation.status}\nReference: ${donation.transaction_id || donation.id}`,
      });
    }
  } catch (err) {
    console.warn('⚠️  Could not send donation email:', err.message);
  }
}


// Emails a website "Send Us a Message" enquiry to the team. Returns
// { sent: true, to } or { sent: false, error } — never throws. The message is
// already saved in the database by the time this runs.
async function sendContactMessage(m) {
  try {
    const cfg = await getConfig();
    if (!cfg.configured) {
      const error = 'Email is not configured (no SMTP host / from address) — set it in Admin Console → API Key Settings → Email.';
      console.warn('⚠️  Contact form email NOT sent:', error);
      return { sent: false, error };
    }
    const to = cfg.adminNotify || cfg.replyTo || cfg.fromAddress || cfg.user;
    if (!to) return { sent: false, error: 'No recipient address configured (set "admin notify" in Email settings).' };
    await send({
      to,
      replyTo: m.email,
      subject: `Website enquiry from ${m.name}${m.organisation ? ` (${m.organisation})` : ''}`,
      text: `New message from the website contact form.\n\nName: ${m.name}\nEmail: ${m.email}\nOrganisation: ${m.organisation || '-'}\n\n${m.message}\n\n— Reply to this email to respond directly to ${m.name}.`,
      html: `<p><strong>New message from the website contact form.</strong></p><p>Name: ${esc(m.name)}<br>Email: <a href="mailto:${esc(m.email)}">${esc(m.email)}</a><br>Organisation: ${esc(m.organisation || '-')}</p><p style="white-space:pre-wrap">${esc(m.message)}</p><p style="color:#666">Reply to this email to respond directly to ${esc(m.name)}.</p>`,
    });
    console.log(`✉️  Contact form email sent to ${to} (from visitor ${m.email})`);
    return { sent: true, to };
  } catch (err) {
    console.warn('⚠️  Could not send contact-form email:', err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { getConfig, send, sendBatch, verify, sendDonationEmails, sendContactMessage };
