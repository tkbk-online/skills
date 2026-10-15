#!/usr/bin/env node
/**
 * Ozon Seller API — customer questions about products.
 *   node ozon-questions.mjs count
 *   node ozon-questions.mjs list [--status NEW|VIEWED|PROCESSED|UNPROCESSED|ALL] [--json] [--limit N]
 *   node ozon-questions.mjs answer <question_id> <sku> "<text>"
 * Credentials: OZON_CLIENT_ID and OZON_API_KEY from the environment (never printed, never logged).
 * No dependencies, Node >= 20.
 */
const API = 'https://api-seller.ozon.ru';
const PATHS = { count: '/v1/question/count', list: '/v1/question/list', answer: '/v1/question/answer/create' };
const RETRIES = 3;
const PAGE_LIMIT = 50; // safety cap on pages per run

const clientId = process.env.OZON_CLIENT_ID;
const apiKey = process.env.OZON_API_KEY;
if (!clientId || !apiKey) {
  console.error('Set OZON_CLIENT_ID and OZON_API_KEY in the environment (Seller cabinet → Settings → Seller API).');
  process.exit(2);
}

async function call(path, body) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(API + path, {
      method: 'POST',
      headers: { 'Client-Id': clientId, 'Api-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 429 && attempt < RETRIES) {
      const wait = Number(res.headers.get('retry-after')) || attempt;
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`Ozon ${res.status} on ${path}: ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : {};
  }
}

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const json = args.includes('--json');

try {
  if (cmd === 'count') {
    const d = await call(PATHS.count, {});
    console.log(json ? JSON.stringify(d, null, 2) : Object.entries(d).map(([k, v]) => `${k}: ${v}`).join('\n'));
  } else if (cmd === 'list') {
    const status = (flag('--status', 'NEW') || 'NEW').toUpperCase();
    const limit = Number(flag('--limit', 0)) || Infinity;
    const out = [];
    let lastId = '';
    for (let page = 0; page < PAGE_LIMIT; page++) {
      const d = await call(PATHS.list, { filter: { status }, last_id: lastId });
      const items = d.questions || d.result?.questions || [];
      for (const q of items) out.push({ id: q.id, sku: q.sku, text: q.text, author: q.author_name, published_at: q.published_at, status: q.status, answers: q.answers_count, product_url: q.product_url });
      lastId = d.last_id || d.result?.last_id || '';
      if (!items.length || !lastId || out.length >= limit) break;
    }
    const list = out.slice(0, limit);
    if (json) console.log(JSON.stringify(list, null, 2));
    else if (!list.length) console.log(`No questions with status ${status}.`);
    else for (const q of list) console.log(`#${q.id} sku ${q.sku} (${(q.published_at || '').slice(0, 10)}, ${q.author || '—'}):\n  ${q.text}\n`);
  } else if (cmd === 'answer') {
    const [, questionId, sku, text] = args;
    if (!questionId || !sku || !text) throw new Error('usage: answer <question_id> <sku> "<text>"');
    if (text.length < 2 || text.length > 5000) throw new Error('answer text must be 2–5000 characters');
    const d = await call(PATHS.answer, { question_id: questionId, sku: Number(sku), text });
    console.log(json ? JSON.stringify(d) : `Answer published: ${d.answer_id || d.result?.answer_id || 'ok'}`);
  } else {
    console.error('usage: ozon-questions.mjs count | list [--status NEW] [--json] [--limit N] | answer <question_id> <sku> "<text>"');
    process.exit(2);
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
