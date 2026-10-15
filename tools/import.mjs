#!/usr/bin/env node
/**
 * Import skills listed in tools/sources.json from local clones of the source repositories.
 *   node tools/import.mjs --from <dir with clones> [--only <name>]
 * For every non-bridge entry: copies <clone>/<path> to skills/<category>/<front matter name>/, drops junk
 * (.DS_Store, *.pyc, __pycache__, node_modules, .git), keeps the skill's own LICENSE* (or copies the repository
 * LICENSE in), and appends a `tkbk:` block to the front matter: source URL pinned to the commit, license, import date.
 * The skill body is never changed. Run tools/audit.mjs afterwards.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseFrontMatter } from './audit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const MANIFEST = JSON.parse(readFileSync(join(HERE, 'sources.json'), 'utf8'));
const JUNK = /^(\.DS_Store|Thumbs\.db|__pycache__|node_modules|\.git|.*\.pyc)$/;

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const from = flag('--from');
const only = flag('--only');
if (!from) { console.error('usage: import.mjs --from <dir with clones> [--only <skill>]'); process.exit(2); }

const today = new Date().toISOString().slice(0, 10);
const licenseOf = (dir) => readdirSync(dir).find((f) => /^(LICENSE|LICENCE|COPYING)(\.|$)/i.test(f));

function addTkbkBlock(skillMd, fields) {
  const text = readFileSync(skillMd, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!m) throw new Error(`${skillMd}: no front matter`);
  const body = m[1].replace(/\r?\n?tkbk:\n(?:  .*\n?)*$/, ''); // replace an earlier import block
  const block = ['tkbk:', ...Object.entries(fields).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)].join('\n');
  writeFileSync(skillMd, `---\n${body}\n${block}\n---${text.slice(m[0].length - m[2].length)}`);
}

let done = 0;
for (const s of MANIFEST.skills) {
  if (s.bridge) continue;
  const src = MANIFEST.sources[s.source];
  const cloneDir = resolve(from, src.clone);
  const skillSrc = join(cloneDir, s.path);
  if (!existsSync(join(skillSrc, 'SKILL.md'))) { console.error(`✗ ${s.source}/${s.path}: no SKILL.md in the clone`); process.exitCode = 1; continue; }
  const fm = parseFrontMatter(readFileSync(join(skillSrc, 'SKILL.md'), 'utf8'));
  const name = fm?.name;
  if (!name) { console.error(`✗ ${s.path}: front matter has no name`); process.exitCode = 1; continue; }
  if (only && only !== name && only !== basename(s.path)) continue;
  const sha = execFileSync('git', ['-C', cloneDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const target = join(ROOT, 'skills', s.category, name);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(dirname(target), { recursive: true });
  cpSync(skillSrc, target, { recursive: true, filter: (p) => !JUNK.test(basename(p)) });
  if (!licenseOf(target)) {
    const repoLicense = licenseOf(cloneDir);
    if (repoLicense) cpSync(join(cloneDir, repoLicense), join(target, 'LICENSE'));
    else if (src.licenseNote) writeFileSync(join(target, 'NOTICE'), `${src.licenseNote}\nSource: https://github.com/${s.source}/tree/${sha.slice(0, 12)}/${s.path}\n`);
    else console.error(`! ${name}: no LICENSE in the skill or the repository — check ${s.source}`);
  }
  addTkbkBlock(join(target, 'SKILL.md'), {
    source: `https://github.com/${s.source}/tree/${sha.slice(0, 12)}/${s.path}`,
    upstream: s.source,
    license: s.license,
    imported: today,
    description_ru: s.ru,
  });
  const size = Math.round(dirSize(target) / 1024);
  console.log(`✓ ${s.category}/${name}  ←  ${s.source}@${sha.slice(0, 7)}/${s.path}  (${size} KB)`);
  done++;
}
console.log(`${done} skills imported`);

function dirSize(dir) {
  let n = 0;
  for (const f of readdirSync(dir)) { const p = join(dir, f); const st = statSync(p); n += st.isDirectory() ? dirSize(p) : st.size; }
  return n;
}
