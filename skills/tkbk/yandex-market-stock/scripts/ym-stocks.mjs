#!/usr/bin/env node
/**
 * Yandex Market partner API — stocks and turnover of a store.
 *   node ym-stocks.mjs --campaign <campaignId> [--json] [--min N] [--offers SKU1,SKU2] [--no-turnover]
 *   node ym-stocks.mjs --business <businessId> ...   (FBS/DBS cabinets without warehouse groups)
 * Credential: YM_API_KEY from the environment (header Api-Key); never printed. Read-only. Node >= 20, no deps.
 */
const API = 'https://api.partner.market.yandex.ru';
const PAGE = 200;
const RETRIES = 4;

const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const has = (name) => args.includes(name);
const key = process.env.YM_API_KEY;
if (!key) { console.error('Set YM_API_KEY in the environment (partner cabinet → Settings → API).'); process.exit(2); }
const campaign = flag('--campaign');
const business = flag('--business');
if (!campaign && !business) { console.error('usage: ym-stocks.mjs --campaign <campaignId> | --business <businessId> [--json] [--min N] [--offers a,b]'); process.exit(2); }
const min = Number(flag('--min', NaN));
const offers = (flag('--offers', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const withTurnover = !has('--no-turnover');

async function post(path, body, query = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== '') url.searchParams.set(k, v);
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { method: 'POST', headers: { 'Api-Key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if ((res.status === 429 || res.status === 420) && attempt < RETRIES) {
      await new Promise((r) => setTimeout(r, (Number(res.headers.get('retry-after')) || attempt * 2) * 1000));
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`Market ${res.status} on ${path}: ${text.slice(0, 400)}`);
    return JSON.parse(text);
  }
}

const path = campaign ? `/v2/campaigns/${campaign}/offers/stocks` : `/v3/businesses/${business}/offers/stocks`;
const rows = new Map(); // offerId -> aggregated
let token = '';
try {
  for (let page = 0; page < 500; page++) {
    const body = offers.length ? { offerIds: offers, withTurnover } : { withTurnover, archived: false };
    const d = await post(path, body, offers.length ? {} : { limit: PAGE, page_token: token });
    const result = d.result || {};
    for (const w of result.warehouses || []) {
      for (const o of w.offers || []) {
        const r = rows.get(o.offerId) || { offerId: o.offerId, available: 0, fit: 0, freeze: 0, defect: 0, expired: 0, quarantine: 0, warehouses: 0, turnoverDays: null, turnover: null, updatedAt: o.updatedAt };
        r.warehouses++;
        for (const s of o.stocks || []) {
          const k = String(s.type || '').toLowerCase();
          if (k in r) r[k] += s.count || 0;
        }
        if (o.turnoverSummary) { r.turnoverDays = o.turnoverSummary.turnoverDays ?? r.turnoverDays; r.turnover = o.turnoverSummary.turnover ?? r.turnover; }
        rows.set(o.offerId, r);
      }
    }
    token = result.paging?.nextPageToken || '';
    if (!token || offers.length) break;
  }
} catch (e) { console.error(e.message); process.exit(1); }

let list = [...rows.values()].map((r) => ({ ...r, sellable: r.available || Math.max(r.fit - r.freeze, 0) }));
if (Number.isFinite(min)) list = list.filter((r) => r.sellable < min);
list.sort((a, b) => a.sellable - b.sellable);

if (has('--json')) console.log(JSON.stringify(list, null, 2));
else if (!list.length) console.log('No offers match.');
else {
  const w = Math.max(7, ...list.map((r) => r.offerId.length));
  console.log(`${'SKU'.padEnd(w)}  avail  fit  freeze  defect  turnoverDays  turnover`);
  for (const r of list) console.log(`${r.offerId.padEnd(w)}  ${String(r.sellable).padStart(5)}  ${String(r.fit).padStart(3)}  ${String(r.freeze).padStart(6)}  ${String(r.defect + r.expired + r.quarantine).padStart(6)}  ${String(r.turnoverDays ?? '—').padStart(12)}  ${r.turnover ?? '—'}`);
  console.log(`\n${list.length} offers`);
}
