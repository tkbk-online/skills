#!/usr/bin/env node
/**
 * Build the catalog from the skill folders + tools/sources.json:
 *   catalog.json  — machine-readable list (name, category, descriptions, source, license, audit status, install command)
 *   index.html    — static showcase page (no external scripts), copy-to-clipboard install commands
 *   README.md     — the tables between <!-- catalog:start --> and <!-- catalog:end -->
 * Usage: node tools/build-catalog.mjs [--check]   (--check: fail if the files on disk are stale — used in CI)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { audit, parseFrontMatter } from './audit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const REPO = 'tkbk-online/skills';
const REPO_URL = `https://github.com/${REPO}`;
const MANIFEST = JSON.parse(readFileSync(join(HERE, 'sources.json'), 'utf8'));
const check = process.argv.includes('--check');

/** Own skills: metadata.verified; imported: tkbk.imported. */
export function collect() {
  const report = audit([join(ROOT, 'skills')]);
  const byName = (name) => report.findings.filter((f) => f.skill === name);
  const skillsDir = join(ROOT, 'skills');
  const entries = [];
  for (const category of readdirSync(skillsDir)) {
    const catDir = join(skillsDir, category);
    if (!existsSync(join(catDir, 'SKILL.md')) && readdirSync(catDir).length) {
      for (const name of readdirSync(catDir)) {
        const md = join(catDir, name, 'SKILL.md');
        if (!existsSync(md)) continue;
        const fm = parseFrontMatter(readFileSync(md, 'utf8')) || {};
        const t = fm.tkbk || {};
        const own = category === 'tkbk';
        const f = byName(name);
        const errors = f.filter((x) => x.severity === 'error').length;
        const warnings = f.filter((x) => x.severity === 'warn').length;
        const accepted = f.filter((x) => x.severity === 'accepted').length;
        entries.push({
          name,
          category,
          path: `skills/${category}/${name}/SKILL.md`,
          url: `${REPO_URL}/tree/main/skills/${category}/${name}`,
          description: own ? (t.description_en || fm.description) : fm.description,
          description_ru: own ? fm.metadata?.summary || fm.description : t.description_ru || fm.description,
          source: own ? REPO_URL : t.source,
          upstream: own ? REPO : t.upstream,
          license: own ? 'MIT' : t.license,
          checked: own ? fm.metadata?.verified || '' : t.imported || '',
          modified: t.modified || '',
          install: `npx skills add ${REPO} --skill ${name}`,
          audit: { errors, warnings, accepted, status: errors ? 'fail' : 'pass' },
        });
      }
    }
  }
  const bridges = MANIFEST.skills.filter((s) => s.bridge).map((s) => {
    const name = basename(s.path);
    const installable = /^skills\//.test(s.path) || /^skills\/\.curated\//.test(s.path);
    return {
      name,
      category: s.category,
      bridge: true,
      url: `https://github.com/${s.source}/tree/main/${s.path}`,
      description_ru: s.ru,
      source: `https://github.com/${s.source}/tree/main/${s.path}`,
      upstream: s.source,
      license: s.license,
      install: installable ? `npx skills add ${s.source} --skill ${name}` : '',
    };
  });
  const order = Object.keys(MANIFEST.categories);
  const all = [...entries, ...bridges].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || (a.bridge ? 1 : 0) - (b.bridge ? 1 : 0) || a.name.localeCompare(b.name));
  return { report, skills: all, categories: order.map((id) => ({ id, ...MANIFEST.categories[id], skills: all.filter((s) => s.category === id) })) };
}

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cell = (s = '') => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const auditLabel = (s) => (s.bridge ? 'ссылка, не копируется' : `${s.audit.status === 'pass' ? '✅' : '❌'} ${s.checked}${s.audit.warnings ? ` · ⚠️ ${s.audit.warnings}` : ''}${s.audit.accepted ? ` · принято ${s.audit.accepted}` : ''}`);
const srcLabel = (s) => (s.upstream === REPO ? 'TKBK' : `[${s.upstream}](${s.source})${s.modified ? ' · скрипты через шлюз TKBK' : ''}`);

export function renderReadme(c) {
  const out = [];
  const total = c.skills.filter((s) => !s.bridge).length;
  const own = c.skills.filter((s) => s.category === 'tkbk').length;
  out.push(`Всего **${total}** скилов в каталоге (${own} своих, ${total - own} импортированных) и ${c.skills.length - total} ссылок на скилы, которые ставятся из исходного репозитория. Установка любого: \`npx skills add ${REPO} --skill <имя>\`.`, '');
  for (const cat of c.categories) {
    if (!cat.skills.length) continue;
    out.push(`### ${cat.title}`, '', cat.text, '', '| Скил | Что делает | Источник | Лицензия | Проверка |', '|---|---|---|---|---|');
    for (const s of cat.skills) {
      const name = s.bridge ? `[${s.name}](${s.url}) ↗` : `[${s.name}](${s.path})`;
      out.push(`| ${name} | ${cell(s.description_ru)} | ${srcLabel(s)} | ${cell(s.license)} | ${auditLabel(s)} |`);
    }
    out.push('');
  }
  return out.join('\n');
}

export function renderHtml(c) {
  const total = c.skills.filter((s) => !s.bridge).length;
  const cards = c.categories.filter((cat) => cat.skills.length).map((cat) => `
<section id="${cat.id}">
  <h2>${esc(cat.title)} <span class="count">${cat.skills.length}</span></h2>
  <p class="cat-text">${esc(cat.text)}</p>
  <div class="grid">${cat.skills.map((s) => `
    <article class="card" data-name="${esc(s.name)}" data-text="${esc(`${s.name} ${s.description_ru} ${s.description || ''} ${s.upstream}`.toLowerCase())}">
      <div class="top"><code class="name">${esc(s.name)}</code>${s.bridge ? '<span class="badge link">ссылка</span>' : `<span class="badge ${s.audit.status}">${s.audit.status === 'pass' ? '✓ проверен' : '✗ ошибки'}${s.audit.warnings ? ` · ⚠ ${s.audit.warnings}` : ''}</span>`}</div>
      <p class="desc">${esc(s.description_ru)}</p>
      <p class="meta">${esc(s.upstream === REPO ? 'TKBK' : s.upstream)} · ${esc(s.license)}${s.checked ? ` · ${esc(s.checked)}` : ''}${s.modified ? ' · скрипты через шлюз TKBK' : ''}</p>
      ${s.install ? `<div class="cmd"><code>${esc(s.install)}</code><button type="button" data-copy="${esc(s.install)}">копировать</button></div>` : ''}
      <p class="links"><a href="${esc(s.url)}" target="_blank" rel="noreferrer noopener">${s.bridge ? 'репозиторий источника' : 'SKILL.md на GitHub'} ↗</a>${!s.bridge && s.upstream !== REPO ? ` · <a href="${esc(s.source)}" target="_blank" rel="noreferrer noopener">источник ↗</a>` : ''}</p>
    </article>`).join('')}
  </div>
</section>`).join('\n');
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TKBK Skills Hub — проверенные скилы для ИИ-агентов</title>
<meta name="description" content="Каталог проверенных SKILL.md для Claude Code, Cursor, Codex и TKBK Agent: Wildberries, Ozon, Яндекс Маркет, Битрикс24, amoCRM, Авито, ЮKassa, документы, плюс официальные скилы Anthropic, OpenAI, DeepSeek, Z.ai и инженерные практики.">
<style>
:root{--bg:#08090b;--card:#101114;--line:#292c32;--text:#eeefef;--muted:#b2b5bd;--dim:#959aa5;--accent:#c4f58a;--violet:#b8a6ff;--amber:#f5d58a;--red:#ff8a8a}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--accent)}code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px}
header,main,footer{width:min(1180px,calc(100% - 32px));margin-inline:auto}
header{padding:56px 0 24px}header h1{font-size:clamp(30px,4vw,48px);line-height:1.1;letter-spacing:-.03em;margin:0 0 14px;font-weight:600}
header p{color:var(--muted);max-width:760px;margin:0 0 18px}
.eyebrow{color:var(--accent);font-size:12px;letter-spacing:.12em;text-transform:uppercase}
.install{display:flex;gap:8px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px;max-width:760px}
.install code{flex:1;overflow-x:auto;white-space:nowrap}
button{cursor:pointer;border:1px solid var(--line);background:#17191d;color:var(--muted);border-radius:8px;padding:6px 10px;font-size:11px;letter-spacing:.06em;text-transform:uppercase}
button:hover{border-color:var(--accent);color:var(--accent)}
nav{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 8px}nav a{color:var(--muted);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:4px 12px;font-size:13px}nav a:hover{color:var(--text);border-color:#555a65}
.search{width:100%;max-width:760px;margin:10px 0 0;background:var(--card);border:1px solid var(--line);color:var(--text);border-radius:10px;padding:10px 12px;font-size:15px}
section{padding:28px 0 8px;border-top:1px solid var(--line)}section h2{font-size:24px;margin:0 0 6px;letter-spacing:-.02em;font-weight:600}
.count{color:var(--dim);font-size:14px;font-weight:400;margin-left:8px}.cat-text{color:var(--dim);margin:0 0 18px;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:8px;min-width:0}
.card[hidden]{display:none}.top{display:flex;justify-content:space-between;gap:10px;align-items:center}.name{color:var(--text);font-size:14px}
.badge{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--line);color:var(--muted);white-space:nowrap}.badge.pass{color:var(--accent);border-color:#3a4a2a}.badge.fail{color:var(--red)}.badge.link{color:var(--violet)}
.desc{margin:0;color:var(--muted);font-size:13.5px}.meta{margin:0;color:var(--dim);font-size:12px}
.cmd{display:flex;gap:8px;align-items:center;background:#0b0c0e;border:1px solid var(--line);border-radius:8px;padding:6px 8px;margin-top:auto}.cmd code{flex:1;overflow-x:auto;white-space:nowrap;color:var(--muted)}
.links{margin:0;font-size:13px}.links a{color:var(--dim)}.links a:hover{color:var(--text)}
.verified{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin:32px 0}.verified ul{columns:2;gap:24px;padding-left:18px;color:var(--muted);font-size:13.5px}
@media (max-width:640px){.verified ul{columns:1}header{padding-top:32px}}
footer{padding:28px 0 48px;color:var(--dim);font-size:13px;border-top:1px solid var(--line)}
</style>
</head>
<body>
<header>
  <div class="eyebrow">TKBK Skills Hub</div>
  <h1>Проверенные скилы для ИИ-агентов</h1>
  <p>${total} скилов в формате SKILL.md для Claude Code, Cursor, Codex CLI, Cline, OpenCode и TKBK Agent: российские маркетплейсы, CRM, Авито и ЮKassa от TKBK плюс официальные скилы Anthropic, OpenAI, DeepSeek и Z.ai и инженерные практики. Каждый проходит аудит безопасности <code>tools/audit.mjs</code>; запись во внешние сервисы — только с вашего подтверждения.</p>
  <div class="install"><code>npx skills add ${REPO} --skill wb-reviews</code><button type="button" data-copy="npx skills add ${REPO} --skill wb-reviews">копировать</button></div>
  <nav>${c.categories.filter((x) => x.skills.length).map((x) => `<a href="#${x.id}">${esc(x.title)} · ${x.skills.length}</a>`).join('')}<a href="#verified">Что проверяем</a><a href="${REPO_URL}" target="_blank" rel="noreferrer noopener">GitHub ↗</a></nav>
  <input class="search" type="search" placeholder="Поиск по названию и описанию: отзывы, ревью, React, оплата…" aria-label="Поиск по каталогу">
</header>
<main>
${cards}
<section id="verified">
  <h2>Проверено TKBK: что именно проверяем</h2>
  <div class="verified"><ul>
    <li><b>Загрузка в оболочку</b> — curl или wget в sh, bash, PowerShell.</li>
    <li><b>Чужие ключи</b> — ~/.ssh, приватные ключи, .aws, .netrc, .npmrc, kube-конфиг, учётные данные Claude Code, отправка .env.</li>
    <li><b>Дамп окружения</b> — printenv и env в канал или файл, сериализация process.env / os.environ.</li>
    <li><b>Зашитые секреты</b> — ключи API, токены GitHub, Slack, Telegram, приватные ключи.</li>
    <li><b>Обфускация</b> — base64-декодирование, eval, new Function, невидимые символы, байтовые массивы: в коде — ошибка, в тексте гайда — предупреждение.</li>
    <li><b>Разрушительные команды</b> — rm -rf корня и дома, форматирование дисков, reverse shell, отключение защиты, запуск агента без проверки прав.</li>
    <li><b>Инъекции в агента</b> — «ignore previous instructions», «do not tell the user», «без ведома пользователя», jailbreak-фразы.</li>
    <li><b>Сетевые адреса</b> — каждый хост сверяется с allow-list: в скриптах чужой хост — ошибка, в документации — предупреждение; IP вместо домена — ошибка.</li>
    <li><b>Структура и лицензии</b> — frontmatter name/description, только текстовые файлы и картинки, без бинарников и симлинков; LICENSE и ссылка на источник у каждого импортированного скила.</li>
    <li><b>Принятые находки</b> — всё, что осталось осознанно, лежит в <code>tools/audit-accept.json</code> с причиной и показано в отчёте.</li>
  </ul></div>
</section>
</main>
<footer>MIT для скилов TKBK; импортированные скилы сохраняют лицензии источников (Apache-2.0, MIT). <a href="${REPO_URL}">${REPO}</a> · <a href="https://tkbk.online">tkbk.online</a></footer>
<script>
for (const b of document.querySelectorAll('button[data-copy]')) b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(b.dataset.copy); } catch {} const t = b.textContent; b.textContent = 'скопировано'; setTimeout(() => { b.textContent = t; }, 1500); });
const q = document.querySelector('.search');
q.addEventListener('input', () => { const v = q.value.trim().toLowerCase(); for (const c of document.querySelectorAll('.card')) c.hidden = !!v && !c.dataset.text.includes(v); for (const s of document.querySelectorAll('main section[id]')) { if (s.id === 'verified') continue; s.hidden = !!v && ![...s.querySelectorAll('.card')].some((c) => !c.hidden); } });
</script>
</body>
</html>
`;
}

function main() {
  const c = collect();
  const readmePath = join(ROOT, 'README.md');
  const readme = readFileSync(readmePath, 'utf8');
  const start = '<!-- catalog:start -->';
  const end = '<!-- catalog:end -->';
  const a = readme.indexOf(start);
  const b = readme.indexOf(end);
  if (a < 0 || b < 0) throw new Error('README.md has no <!-- catalog:start --> / <!-- catalog:end --> markers');
  const nextReadme = `${readme.slice(0, a + start.length)}\n${renderReadme(c)}${readme.slice(b)}`;
  const json = JSON.stringify({ repo: REPO, total: c.skills.filter((s) => !s.bridge).length, categories: c.categories.map((x) => ({ id: x.id, title: x.title, title_en: x.title_en, text: x.text, skills: x.skills })) }, null, 2) + '\n';
  const html = renderHtml(c);
  const files = { 'README.md': nextReadme, 'catalog.json': json, 'index.html': html };
  const stale = Object.entries(files).filter(([f, text]) => !existsSync(join(ROOT, f)) || readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n') !== text.replace(/\r\n/g, '\n')).map(([f]) => f);
  if (check) {
    if (stale.length) { console.error(`catalog is stale: ${stale.join(', ')} — run: node tools/build-catalog.mjs`); return 1; }
    console.log('catalog up to date');
    return 0;
  }
  for (const [f, text] of Object.entries(files)) writeFileSync(join(ROOT, f), text);
  console.log(`catalog: ${c.skills.length} entries (${c.report.errors} audit errors, ${c.report.warnings} warnings, ${c.report.accepted} accepted) → ${Object.keys(files).join(', ')}${stale.length ? ` (updated: ${stale.join(', ')})` : ' (unchanged)'}`);
  return c.report.errors ? 1 : 0;
}

if (basename(process.argv[1] || '') === 'build-catalog.mjs') {
  try { process.exitCode = main(); } catch (e) { console.error(`build-catalog: ${e.message}`); process.exitCode = 2; }
}
