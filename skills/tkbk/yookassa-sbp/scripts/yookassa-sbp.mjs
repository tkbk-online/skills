#!/usr/bin/env node
/**
 * YooKassa API v3 — create / inspect / wait / refund a payment (for integration checks with a TEST shop).
 *   node yookassa-sbp.mjs create <amountRub> "<description>" --return-url <url> [--sbp] [--order <id>]
 *   node yookassa-sbp.mjs get <payment_id>
 *   node yookassa-sbp.mjs wait <payment_id>            polls every 5 s, up to 10 minutes
 *   node yookassa-sbp.mjs refund <payment_id> <amountRub>
 * Credentials: YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY from the environment; never printed. Node >= 20, no deps.
 */
import { randomUUID } from 'node:crypto';

const API = 'https://api.yookassa.ru/v3';
const shopId = process.env.YOOKASSA_SHOP_ID;
const secret = process.env.YOOKASSA_SECRET_KEY;
if (!shopId || !secret) { console.error('Set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY in the environment.'); process.exit(2); }
// HTTP Basic auth header (standard encoding, no payload hidden here)
const basic = 'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64');

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: basic, 'Content-Type': 'application/json', ...(body ? { 'Idempotence-Key': randomUUID() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`YooKassa ${res.status} on ${method} ${path}: ${text.slice(0, 400)}`);
  return JSON.parse(text);
}

const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const money = (v) => ({ value: Number(v).toFixed(2), currency: 'RUB' });
const show = (p) => console.log(JSON.stringify({ id: p.id, status: p.status, paid: p.paid, amount: p.amount, method: p.payment_method?.type, confirmation_url: p.confirmation?.confirmation_url, test: p.test, metadata: p.metadata, cancellation: p.cancellation_details }, null, 2));

try {
  const [cmd, a, b] = args;
  if (cmd === 'create') {
    const amount = Number(a);
    const returnUrl = flag('--return-url');
    if (!(amount > 0) || !b || !returnUrl) throw new Error('usage: create <amountRub> "<description>" --return-url <url> [--sbp] [--order <id>]');
    const p = await api('POST', '/payments', {
      amount: money(amount),
      capture: true,
      description: b.slice(0, 128),
      confirmation: { type: 'redirect', return_url: returnUrl },
      metadata: { order_id: flag('--order', 'check') },
      ...(args.includes('--sbp') ? { payment_method_data: { type: 'sbp' } } : {}),
    });
    show(p);
  } else if (cmd === 'get') {
    if (!a) throw new Error('usage: get <payment_id>');
    show(await api('GET', `/payments/${a}`));
  } else if (cmd === 'wait') {
    if (!a) throw new Error('usage: wait <payment_id>');
    const until = Date.now() + 10 * 60 * 1000;
    for (;;) {
      const p = await api('GET', `/payments/${a}`);
      if (p.status === 'succeeded' || p.status === 'canceled' || Date.now() > until) { show(p); break; }
      process.stdout.write(`${new Date().toISOString().slice(11, 19)} ${p.status}\n`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  } else if (cmd === 'refund') {
    if (!a || !(Number(b) > 0)) throw new Error('usage: refund <payment_id> <amountRub>');
    const r = await api('POST', '/refunds', { payment_id: a, amount: money(b) });
    console.log(JSON.stringify({ id: r.id, status: r.status, amount: r.amount }, null, 2));
  } else {
    console.error('usage: create | get | wait | refund (see the header of this file)');
    process.exit(2);
  }
} catch (e) { console.error(e.message); process.exit(1); }
