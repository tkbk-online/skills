#!/usr/bin/env node
/**
 * Check a TKBK key against the gateway: health, model list, optional one-line chat.
 *   node tkbk-check.mjs [--chat] [--model <id>]
 * Key: TKBK_API_KEY, else ANTHROPIC_AUTH_TOKEN, else OPENAI_API_KEY. Only a mask (cr_…1234) is ever printed.
 * Node >= 20, no dependencies.
 */
const BASE = 'https://api.tkbk.online';
const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const key = process.env.TKBK_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.OPENAI_API_KEY;
const mask = key ? `${key.slice(0, 3)}…${key.slice(-4)}` : '(none)';
let failed = false;

async function step(title, fn) {
  try { console.log(`✓ ${title}: ${await fn()}`); }
  catch (e) { failed = true; console.log(`✗ ${title}: ${e.message}`); }
}

await step('gateway health', async () => {
  const r = await fetch(`${BASE}/health`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return j.status || 'ok';
});

if (!key) {
  console.log('✗ key: set TKBK_API_KEY (or ANTHROPIC_AUTH_TOKEN / OPENAI_API_KEY) in the environment');
  process.exit(1);
}
if (!key.startsWith('cr_')) console.log(`! key ${mask} does not start with cr_ — TKBK keys do; check for a stray "Bearer " prefix or another provider's key`);

await step(`models with key ${mask}`, async () => {
  const r = await fetch(`${BASE}/v1/models`, { headers: { Authorization: `Bearer ${key}` } });
  if (r.status === 401) throw new Error('401 — the key is wrong, disabled or has a stray prefix');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  const ids = (j.data || []).map((m) => m.id);
  return `${ids.length} models (${ids.slice(0, 6).join(', ')}${ids.length > 6 ? ', …' : ''})`;
});

if (args.includes('--chat')) {
  const model = flag('--model', 'tkbk-cheap');
  await step(`chat with ${model}`, async () => {
    const r = await fetch(`${BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 16, messages: [{ role: 'user', content: 'Reply with the single word: pong' }] }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.status === 402) throw new Error('402 — the key has no balance left');
    if (r.status === 404) throw new Error(`404 — model "${model}" is not in the catalog`);
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
    const text = j.choices?.[0]?.message?.content ?? '';
    const u = j.usage || {};
    return `"${String(text).trim().slice(0, 40)}" — tokens in/out ${u.prompt_tokens ?? '?'}/${u.completion_tokens ?? '?'}`;
  });
}

process.exit(failed ? 1 : 0);
