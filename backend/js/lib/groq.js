// ============================================================
// Headstart Education — Groq LLM client
// The API key and model are managed in Admin Console → API Key Settings → Groq (key stored
// encrypted in app_settings). GROQ_API_KEY / GROQ_MODEL env vars are only a
// fallback. Read on every call, so changes apply immediately.
// Uses the official `groq-sdk` package when installed, otherwise falls back
// to calling Groq's OpenAI-compatible HTTP API directly.
// ============================================================
const settings = require('./settings');

let Groq = null;
try { Groq = require('groq-sdk'); } catch { /* fall back to fetch */ }

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const BASE = 'https://api.groq.com/openai/v1';

async function getConfig() {
  const saved = await settings.getAll('groq.');
  const key = saved['groq.api_key'] || process.env.GROQ_API_KEY || '';
  const model = saved['groq.model'] || process.env.GROQ_MODEL || DEFAULT_MODEL;
  return {
    apiKey: key,
    model,
    keySource: saved['groq.api_key'] ? 'console' : (process.env.GROQ_API_KEY ? 'env' : null),
    modelSource: saved['groq.model'] ? 'console' : (process.env.GROQ_MODEL ? 'env' : null),
    configured: !!key,
  };
}

function describeError(err) {
  const status = err?.status || err?.statusCode;
  const msg = err?.error?.error?.message || err?.error?.message || err?.message || String(err);
  if (status === 401) return 'Groq rejected the API key (401). Check it in Admin Console → API Key Settings → Groq.';
  if (status === 404) return `Groq could not find that model (${msg}). Pick another model in Admin Console → API Key Settings → Groq.`;
  if (status === 429) return 'Groq rate limit reached (429). Wait a minute and try again.';
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|fetch failed|Connection error/i.test(msg)) return 'Could not reach api.groq.com from the server (network).';
  return msg;
}

async function http(path, apiKey, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(45000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data?.error?.message || `HTTP ${res.status}`); e.status = res.status; throw e; }
  return data;
}

async function chat({ system, user, temperature = 0.6, maxTokens = 1000, json = false }) {
  const cfg = await getConfig();
  if (!cfg.configured) throw new Error('Groq is not configured. Add your API key in Admin Console → API Key Settings → Groq.');
  const params = {
    model: cfg.model,
    temperature,
    max_tokens: maxTokens,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  };
  const call = async (p) => {
    if (Groq) {
      const client = new Groq({ apiKey: cfg.apiKey, timeout: 45000, maxRetries: 1 });
      return client.chat.completions.create(p);
    }
    return http('/chat/completions', cfg.apiKey, p);
  };
  try {
    let out;
    try {
      out = await call(json ? { ...params, response_format: { type: 'json_object' } } : params);
    } catch (err) {
      // Not every model supports JSON mode — retry as plain text once.
      if (json && (err?.status === 400)) out = await call(params); else throw err;
    }
    return out.choices?.[0]?.message?.content || '';
  } catch (err) {
    throw new Error(describeError(err));
  }
}

async function listModels() {
  const cfg = await getConfig();
  if (!cfg.apiKey) throw new Error('Save your Groq API key first.');
  try {
    let data;
    if (Groq) data = await new Groq({ apiKey: cfg.apiKey, timeout: 20000, maxRetries: 0 }).models.list();
    else data = await http('/models', cfg.apiKey);
    // Chat models only (skip speech/whisper/guard/tts style entries).
    return (data.data || [])
      .filter((m) => m.active !== false && !/whisper|tts|guard|embed|playai|distil-whisper/i.test(m.id))
      .map((m) => m.id).sort();
  } catch (err) {
    throw new Error(describeError(err));
  }
}

async function test() {
  const started = Date.now();
  const text = await chat({ system: 'Reply with one short word.', user: 'Say OK.', maxTokens: 10, temperature: 0 });
  const cfg = await getConfig();
  return { model: cfg.model, reply: String(text).trim().slice(0, 40), ms: Date.now() - started };
}

module.exports = { getConfig, chat, listModels, test, DEFAULT_MODEL };
