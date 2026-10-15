#!/usr/bin/env node
/**
 * TKBK skills audit — checks every skill folder (SKILL.md + scripts) for the patterns that made the 2026 audits of
 * open skill registries find hundreds of malicious skills: pipe-to-shell installers, reads of SSH/cloud credentials,
 * dumps of the environment, hard-coded secrets, obfuscated payloads, destructive commands, prompt injection
 * («do not tell the user»), and network destinations outside the allow-list (tools/allowlist.json).
 *
 * Usage:  node tools/audit.mjs [dir ...] [--json] [--strict] [--summary <file>]
 *   dir      skills root(s) to scan (default: ./skills). A dir that itself holds SKILL.md is one skill.
 *   --json   machine-readable report on stdout
 *   --strict warnings fail the run too
 *   --summary <file>  append a Markdown summary (GitHub Actions: $GITHUB_STEP_SUMMARY)
 * Exit code: 0 — clean, 1 — errors (or warnings with --strict), 2 — bad invocation.
 *
 * No dependencies, Node ≥ 20. The audit never executes anything it scans.
 */
import { readdirSync, readFileSync, lstatSync, statSync, existsSync, appendFileSync } from 'node:fs';
import { join, relative, extname, basename, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ALLOWLIST_PATH = join(HERE, 'allowlist.json');

const TEXT_EXT = new Set(['.md', '.mjs', '.js', '.cjs', '.ts', '.sh', '.py', '.ps1', '.json', '.txt', '.yml', '.yaml', '.toml', '.csv', '.env.example']);
const MAX_FILE_BYTES = 256 * 1024;
const MAX_SKILL_MD_BYTES = 64 * 1024;
const MAX_DESCRIPTION = 1024;
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const TLD_RE = '(?:ru|com|net|org|io|dev|app|su|xyz|top|cc|me|info|co|ai|sh|gg|one|online|site|store|tech|cloud|link|click|ly|to|tk|ml|ga|cf|рф)';

/** [id, severity, regex, message]. Regexes run per line; `i` where case does not matter. */
const RULES = [
  // 1. remote code execution: download piped into a shell
  ['pipe-to-shell', 'error', /\b(curl|wget|iwr|Invoke-WebRequest|Invoke-RestMethod)\b[^\n|]*\|\s*(sudo\s+)?(ba|z|da|k|fi)?sh\b/i, 'download piped into a shell'],
  ['pipe-to-shell', 'error', /\|\s*(iex|Invoke-Expression)\b/i, 'download piped into PowerShell Invoke-Expression'],
  ['pipe-to-shell', 'error', /\b(ba|z)?sh\s+-c\s+["'`]?\s*\$\((curl|wget)\b/i, 'shell -c with a downloaded command'],
  ['pipe-to-shell', 'error', /\b(python3?|node|perl|ruby)\s+<\s*\(\s*(curl|wget)\b/i, 'interpreter fed from a download'],
  // 2. credential files
  ['credential-read', 'error', /(~|\$HOME|%USERPROFILE%|\/home\/[^/\s]+|\/root|\/Users\/[^/\s]+)?[\\/]\.ssh\b/i, 'touches the ~/.ssh directory'],
  ['credential-read', 'error', /\bid_(rsa|dsa|ecdsa|ed25519)\b/i, 'names an SSH private key'],
  ['credential-read', 'error', /[\\/]\.(aws[\\/]credentials|netrc|gnupg|pgpass|npmrc|pypirc|docker[\\/]config\.json|kube[\\/]config|config[\\/]gh[\\/]hosts\.yml)\b/i, 'reads a credential file of another tool'],
  ['credential-read', 'error', /[\\/]\.claude[\\/]\.credentials\.json\b/i, 'reads Claude Code credentials'],
  ['credential-read', 'error', /[\\/]\.claude[\\/]settings(\.local)?\.json\b[^\n]*\b(curl|wget|fetch|http|post|upload|send|cat|base64)\b/i, 'sends or prints Claude Code settings (they hold the key)'],
  ['credential-read', 'error', /[\\/](\.env(\.[a-z]+)?|secrets?\.(json|ya?ml|toml))\b[^\n]*\b(curl|wget|fetch|http|post|upload|send|cat|base64)\b/i, 'sends or prints an .env / secrets file'],
  ['credential-read', 'error', /[\\/]etc[\\/](passwd|shadow)\b/, 'reads system account files'],
  // 3. environment dumps
  ['env-dump', 'error', /\b(printenv|env|set)\b\s*(\||>|>>)\s*/, 'dumps the whole environment'],
  ['env-dump', 'error', /\b(Get-ChildItem|gci|ls|dir)\s+env:\s*(\||>|$)/i, 'dumps the whole environment (PowerShell)'],
  ['env-dump', 'warn', /\bJSON\.stringify\(\s*process\.env\s*\)/, 'serialises the whole process.env'],
  ['env-dump', 'warn', /\bdict\(\s*os\.environ\s*\)|json\.dumps\(\s*os\.environ/, 'serialises the whole os.environ'],
  ['env-dump', 'warn', /\b(Object\.(keys|entries|values)|for\s*\(.*\bin)\b[^\n]*\bprocess\.env\b/, 'iterates over the whole process.env'],
  // 4. hard-coded secrets
  ['secret', 'error', /\b(cr|sk|rk|pk)_(live_|test_)?[A-Za-z0-9]{24,}\b/, 'looks like a hard-coded API key'],
  ['secret', 'error', /\bsk-[A-Za-z0-9_-]{20,}\b/, 'looks like a hard-coded API key (sk-…)'],
  ['secret', 'error', /\b(AKIA|ASIA)[0-9A-Z]{16}\b/, 'looks like an AWS access key'],
  ['secret', 'error', /\b(gh[pousr]|github_pat)_[A-Za-z0-9_]{30,}\b/, 'looks like a GitHub token'],
  ['secret', 'error', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/, 'looks like a Slack token'],
  ['secret', 'error', /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/, 'looks like a Telegram bot token'],
  ['secret', 'error', /-----BEGIN (RSA |OPENSSH |EC |DSA |PGP )?PRIVATE KEY/, 'contains a private key'],
  ['secret', 'error', /\b(api[_-]?key|secret[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|password|passwd)\b\s*[:=]\s*["'`][A-Za-z0-9_\-./+]{16,}["'`]/i, 'hard-coded credential value'],
  // 5. obfuscation
  ['obfuscation', 'error', /\bbase64\s+(-d|--decode|-D)\b/, 'decodes base64 on the command line'],
  ['obfuscation', 'error', /\b(atob|btoa)\s*\(/, 'base64 in JavaScript (atob/btoa)'],
  ['obfuscation', 'error', /Buffer\.from\([^)]*,\s*["'`]base64["'`]\s*\)/, 'base64 payload in Buffer.from'],
  ['obfuscation', 'error', /\b(b64decode|b32decode|a85decode|codecs\.decode)\s*\(/, 'base64/rot13 decoding in Python'],
  ['obfuscation', 'error', /\beval\s*\(/, 'eval()'],
  ['obfuscation', 'error', /\bnew\s+Function\s*\(/, 'new Function()'],
  ['obfuscation', 'error', /\b(exec|execfile|compile)\s*\(\s*["'`(]/, 'exec() of a string in Python'],
  ['obfuscation', 'error', /String\.fromCharCode\s*\([^)]*,[^)]*,/, 'string assembled from char codes'],
  ['obfuscation', 'error', /(\\x[0-9a-f]{2}){6,}/i, 'long hex-escaped string'],
  ['obfuscation', 'error', /(\\u[0-9a-f]{4}){6,}/i, 'long unicode-escaped string'],
  ['obfuscation', 'error', /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/, 'invisible / zero-width characters'],
  ['obfuscation', 'error', /\b(0x[0-9a-f]{2},\s*){8,}/i, 'byte array literal'],
  // 6. destructive and privilege-raising commands
  ['destructive', 'error', /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)[a-zA-Z]*\s+(\/|~|\$HOME|\*|\.)(\s|$)/, 'recursive delete of a root, home or current directory'],
  ['destructive', 'error', /Remove-Item\b[^\n]*-Recurse[^\n]*(C:\\|~|\$HOME|\$env:USERPROFILE)/i, 'recursive delete of a drive or home (PowerShell)'],
  ['destructive', 'error', /\b(mkfs(\.[a-z0-9]+)?|dd\s+if=|shred\s+)/, 'disk-level destructive command'],
  ['destructive', 'error', /:\(\)\s*\{\s*:\|\s*:\s*&\s*\}\s*;\s*:/, 'fork bomb'],
  ['destructive', 'error', /\b(nc|ncat|netcat)\s+(-[a-z]*e|-c)\b|\/dev\/tcp\//i, 'reverse shell'],
  ['destructive', 'error', /--dangerously-skip-permissions|--yolo\b|--no-sandbox\b/, 'runs an agent without permission checks'],
  ['destructive', 'error', /Set-MpPreference|DisableRealtimeMonitoring|setenforce\s+0|ufw\s+disable/i, 'disables security software'],
  ['destructive', 'warn', /\bchmod\s+(-R\s+)?[0-7]*777\b/, 'world-writable permissions'],
  ['destructive', 'warn', /\bsudo\b/, 'asks for root'],
  ['persistence', 'warn', /\b(crontab\s+-|schtasks\s+\/create|launchctl\s+load|systemctl\s+enable)\b/i, 'installs a scheduled task or service'],
  ['persistence', 'warn', /(>>|tee\s+-a)\s*[^\n]*[\\/]\.(bashrc|zshrc|profile|bash_profile|zprofile)\b/, 'writes to a shell profile'],
  // 7. prompt injection against the agent
  ['prompt-injection', 'error', /\bignore\s+(all\s+|any\s+)?(previous|prior|above|earlier)\s+(instructions|rules|prompts)/i, 'tells the agent to ignore its instructions'],
  ['prompt-injection', 'error', /\b(do\s+not|don'?t|never)\s+(tell|inform|show|mention|reveal|disclose)\s+(this\s+|it\s+|anything\s+)?(to\s+)?the\s+user/i, 'tells the agent to hide something from the user'],
  ['prompt-injection', 'error', /\b(without|w\/o)\s+(the\s+)?user'?s?\s+(knowledge|consent|confirmation|noticing)/i, 'tells the agent to act without the user'],
  ['prompt-injection', 'error', /без\s+ведома\s+пользовател/i, 'tells the agent to act without the user (RU)'],
  ['prompt-injection', 'error', /не\s+(сообщай|говори|показывай|рассказывай|упоминай)\s+(об\s+этом\s+|это\s+)?пользовател/i, 'tells the agent to hide something from the user (RU)'],
  ['prompt-injection', 'error', /(скрыт(но|о)|тайно|незаметно)\s+(от|для)\s+пользовател/i, 'tells the agent to hide actions from the user (RU)'],
  ['prompt-injection', 'error', /игнорируй\s+(все\s+)?(предыдущие|прошлые|системные)\s+(инструкции|правила)/i, 'tells the agent to ignore its instructions (RU)'],
  ['prompt-injection', 'error', /\b(you\s+are\s+now|from\s+now\s+on\s+you\s+are)\s+(in\s+)?(developer|god|admin|jailbreak|unrestricted)\s+mode/i, 'jailbreak phrase'],
  ['prompt-injection', 'warn', /\bconfirm\s*:\s*true\b(?![^\n]*(спрос|подтвержд|ask|confirm(ed|ation)\s+(by|from)|after|только после))/i, 'confirm: true without a word about asking the user on the same line'],
  // 8. plain-text transport
  ['insecure-http', 'warn', /\bhttp:\/\/(?!localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)[a-z0-9.-]+/i, 'plain http:// to a remote host'],
  ['ip-destination', 'error', /\bhttps?:\/\/(?!127\.0\.0\.1|0\.0\.0\.0)\d{1,3}(\.\d{1,3}){3}\b/, 'network destination given as a raw IP address'],
];

const NETWORK_RE = /\b(fetch|XMLHttpRequest|https?\.request|https?\.get|axios|got|undici|requests\.(get|post|put|patch|delete|request)|urllib|http\.client|aiohttp|httpx|curl|wget|Invoke-WebRequest|Invoke-RestMethod|WebClient|net\.connect|socket\.)\b/;
const URL_HOST_RE = /https?:\/\/([a-z0-9][a-z0-9.-]*[a-z0-9]|\[[0-9a-f:]+\]|localhost)/gi;
const BARE_HOST_RE = new RegExp(`(?<![\\w@/.-])((?:[a-z0-9-]+\\.)+${TLD_RE})(?![\\w-])`, 'gi');
/** Bare words that look like hosts but are code or prose: file names, versions, method chains. */
const BARE_HOST_IGNORE = /\.(mjs|js|cjs|ts|md|json|py|sh|ps1|txt|yml|yaml|toml|csv|html|css|png|jpg|svg|webp|exe|zip|xml|pdf|docx|xlsx|lock|map)$/i;

export function loadAllowlist(path = ALLOWLIST_PATH) {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  return Object.keys(data.hosts || {}).map((h) => h.toLowerCase());
}

export const hostAllowed = (host, allow) => {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (LOCAL_HOSTS.has(h)) return true;
  return allow.some((a) => h === a || h.endsWith(`.${a}`));
};

/** Minimal YAML front matter: `key: value` lines plus one level of `key:\n  sub: value`. */
export function parseFrontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!m) return null;
  const out = {};
  let section = null;
  for (const raw of m[1].split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const nested = raw.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
    const top = raw.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (top) {
      const [, key, value] = top;
      if (value === '') { section = key; out[key] = {}; }
      else { section = null; out[key] = unquote(value); }
    } else if (nested && section) {
      out[section][nested[1]] = unquote(nested[2]);
    } else if (raw.match(/^\s+-\s+/) && section) {
      (out[section].items ??= []).push(unquote(raw.replace(/^\s+-\s+/, '')));
    }
  }
  return out;
}

const unquote = (v) => v.replace(/^(["'])(.*)\1$/, '$2').trim();

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = lstatSync(p);
    if (st.isSymbolicLink()) { yield { path: p, symlink: true }; continue; }
    if (st.isDirectory()) { if (name !== 'node_modules' && !name.startsWith('.')) yield* walk(p); }
    else yield { path: p, size: st.size };
  }
}

/** Audit one skill folder; returns findings. */
export function auditSkill(dir, { allow = loadAllowlist(), root = dirname(dir) } = {}) {
  const findings = [];
  const skill = basename(dir);
  const rel = (p) => relative(root, p).replace(/\\/g, '/');
  const add = (severity, rule, file, line, message, snippet = '') => findings.push({ skill, severity, rule, file: rel(file), line, message, snippet: snippet.trim().slice(0, 160) });

  const skillMd = join(dir, 'SKILL.md');
  if (!existsSync(skillMd)) { add('error', 'structure', dir, 0, 'no SKILL.md in the skill folder'); return findings; }
  if (!NAME_RE.test(skill)) add('error', 'structure', dir, 0, `folder name "${skill}" must be lowercase letters, digits and hyphens`);

  const md = readFileSync(skillMd, 'utf8');
  if (Buffer.byteLength(md) > MAX_SKILL_MD_BYTES) add('warn', 'structure', skillMd, 0, `SKILL.md is larger than ${MAX_SKILL_MD_BYTES / 1024} KB — agents load it whole`);
  const fm = parseFrontMatter(md);
  if (!fm) add('error', 'frontmatter', skillMd, 1, 'no YAML front matter (--- name / description ---)');
  else {
    if (!fm.name) add('error', 'frontmatter', skillMd, 1, 'front matter has no name');
    else if (fm.name !== skill) add('error', 'frontmatter', skillMd, 1, `name "${fm.name}" differs from the folder "${skill}"`);
    else if (!NAME_RE.test(fm.name)) add('error', 'frontmatter', skillMd, 1, `name "${fm.name}" must be lowercase letters, digits and hyphens`);
    if (!fm.description || typeof fm.description !== 'string') add('error', 'frontmatter', skillMd, 1, 'front matter has no description');
    else if (fm.description.length > MAX_DESCRIPTION) add('error', 'frontmatter', skillMd, 1, `description longer than ${MAX_DESCRIPTION} characters`);
    else if (fm.description.length < 20) add('warn', 'frontmatter', skillMd, 1, 'description shorter than 20 characters — agents will not know when to use the skill');
  }

  for (const f of walk(dir)) {
    if (f.symlink) { add('error', 'structure', f.path, 0, 'symbolic link inside a skill'); continue; }
    const ext = basename(f.path).startsWith('.env') ? '.env.example' : extname(f.path).toLowerCase();
    if (basename(f.path) === '.env' || /^\.env\.(?!example$)/.test(basename(f.path))) { add('error', 'structure', f.path, 0, 'an .env file inside a skill'); continue; }
    if (!TEXT_EXT.has(ext)) { add('error', 'structure', f.path, 0, `unexpected file type "${ext || basename(f.path)}" — only text files (md, mjs, js, ts, sh, py, ps1, json, yml, toml, txt, csv)`); continue; }
    if (f.size > MAX_FILE_BYTES) { add('error', 'structure', f.path, 0, `file larger than ${MAX_FILE_BYTES / 1024} KB`); continue; }
    const text = readFileSync(f.path, 'utf8');
    if (text.includes('\u0000')) { add('error', 'structure', f.path, 0, 'binary content in a text file'); continue; }
    scanText(text, f.path, ext, add, allow);
  }
  return findings;
}

function scanText(text, path, ext, add, allow) {
  const lines = text.split(/\r?\n/);
  const isScript = ext !== '.md' && ext !== '.txt' && ext !== '.json' && ext !== '.csv';
  let hosts = 0;
  let network = false;
  let fence = false;
  lines.forEach((line, i) => {
    const n = i + 1;
    if (ext === '.md' && /^\s*```/.test(line)) fence = !fence;
    for (const [rule, severity, re, message] of RULES) {
      // the "sudo" warning is noise in prose that tells the reader NOT to use it; keep it for code
      if (rule === 'destructive' && severity === 'warn' && ext === '.md' && !fence) continue;
      if (re.test(line)) add(severity, rule, path, n, message, line);
    }
    for (const m of line.matchAll(URL_HOST_RE)) {
      hosts++;
      if (!hostAllowed(m[1], allow)) add('error', 'external-host', path, n, `host "${m[1]}" is not in tools/allowlist.json`, line);
    }
    for (const m of line.matchAll(BARE_HOST_RE)) {
      const host = m[1];
      if (BARE_HOST_IGNORE.test(host) || /^\d/.test(host)) continue;
      if (line.includes(`://${host}`) || line.includes(`@${host}`)) continue; // counted above / an e-mail
      hosts++;
      if (!hostAllowed(host, allow)) add('error', 'external-host', path, n, `host "${host}" is not in tools/allowlist.json`, line);
    }
    if (isScript && NETWORK_RE.test(line)) network = true;
  });
  if (isScript && network && hosts === 0) add('warn', 'dynamic-destination', path, 0, 'script makes network calls but names no host — the destination is decided at runtime');
}

/** Audit a skills root (every child folder) or a single skill folder. */
export function audit(paths, opts = {}) {
  const allow = opts.allow ?? loadAllowlist();
  const skills = [];
  for (const p of paths) {
    const abs = resolve(p);
    if (!existsSync(abs)) throw new Error(`no such path: ${p}`);
    if (existsSync(join(abs, 'SKILL.md'))) { skills.push({ dir: abs, root: dirname(abs) }); continue; }
    for (const name of readdirSync(abs)) {
      const d = join(abs, name);
      if (statSync(d).isDirectory() && !name.startsWith('.')) skills.push({ dir: d, root: abs });
    }
  }
  const findings = skills.flatMap(({ dir, root }) => auditSkill(dir, { allow, root }));
  const errors = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.filter((f) => f.severity === 'warn').length;
  return { skills: skills.map((s) => basename(s.dir)), findings, errors, warnings, ok: errors === 0 && (!opts.strict || warnings === 0) };
}

export function formatReport(r) {
  const out = [];
  const by = new Map();
  for (const f of r.findings) (by.get(f.skill) ?? by.set(f.skill, []).get(f.skill)).push(f);
  for (const s of r.skills) {
    const list = by.get(s) ?? [];
    out.push(`${list.some((f) => f.severity === 'error') ? '✗' : list.length ? '△' : '✓'} ${s}${list.length ? '' : ' — clean'}`);
    for (const f of list) out.push(`    ${f.severity === 'error' ? 'ERROR' : 'warn '} ${f.rule.padEnd(18)} ${f.file}${f.line ? `:${f.line}` : ''} — ${f.message}${f.snippet ? `\n          ${f.snippet}` : ''}`);
  }
  out.push('', `${r.skills.length} skills, ${r.errors} errors, ${r.warnings} warnings — ${r.ok ? 'PASS' : 'FAIL'}`);
  return out.join('\n');
}

export function formatSummary(r) {
  const rows = r.skills.map((s) => {
    const list = r.findings.filter((f) => f.skill === s);
    const e = list.filter((f) => f.severity === 'error').length;
    const w = list.length - e;
    return `| ${s} | ${e ? `❌ ${e}` : '✅ 0'} | ${w ? `⚠️ ${w}` : '0'} |`;
  });
  return ['## TKBK skills audit', '', `**${r.ok ? 'PASS' : 'FAIL'}** — ${r.skills.length} skills, ${r.errors} errors, ${r.warnings} warnings`, '', '| Skill | Errors | Warnings |', '|---|---|---|', ...rows, ''].join('\n');
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const strict = args.includes('--strict');
  const si = args.indexOf('--summary');
  const summary = si >= 0 ? args[si + 1] : process.env.GITHUB_STEP_SUMMARY;
  const paths = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--summary');
  if (si >= 0 && !summary) { console.error('--summary needs a file'); return 2; }
  const r = audit(paths.length ? paths : [join(HERE, '..', 'skills')], { strict });
  if (json) console.log(JSON.stringify(r, null, 2));
  else console.log(formatReport(r));
  if (summary) appendFileSync(summary, formatSummary(r));
  return r.ok ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv); } catch (e) { console.error(`audit: ${e.message}`); process.exitCode = 2; }
}
