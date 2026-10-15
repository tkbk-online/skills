# TKBK Skills Hub

Проверенные скилы для ИИ-агентов под российский рынок: маркетплейсы, CRM, Авито, оплата ЮKassa/СБП, документы.
Формат — `SKILL.md` ([стандарт agent skills](https://github.com/vercel-labs/skills)): работает в Claude Code,
Cursor, Codex CLI, Cline, OpenCode, TKBK Agent и любом агенте, который читает папки `skills/`.

[English below](#english)

## Установка

```bash
# один скил в проект (Claude Code → .claude/skills/, Cursor и Codex → .agents/skills/)
npx skills add tkbk-online/skills --skill wb-reviews

# несколько, глобально, без вопросов
npx skills add tkbk-online/skills --skill wb-reviews --skill tkbk-setup -g -y

# посмотреть список
npx skills add tkbk-online/skills --list
```

Флаг `-a claude-code` / `-a cursor` / `-a codex` выбирает агента. TKBK Agent читает скилы из `.tkbk/skills`
проекта и `~/.tkbk/skills` — скопируйте туда папку скила. Без CLI: скопировать `skills/<имя>/` в папку скилов
вашего агента.

## Каталог

| Скил | Что делает | Нужно |
|---|---|---|
| [wb-reviews](skills/wb-reviews/SKILL.md) | ответы на отзывы Wildberries: сбор → черновики → подтверждение → публикация | MCP `wb` ([tkbk-mcp](https://github.com/tkbk-online/tkbk-mcp)), токен WB |
| [ozon-questions](skills/ozon-questions/SKILL.md) | ответы на вопросы покупателей Ozon, скрипт для Seller API | Client-Id и Api-Key Ozon; MCP `ozon` для остатков |
| [yandex-market-stock](skills/yandex-market-stock/SKILL.md) | остатки Яндекс Маркета, дни запаса, алерты «пора дозаказать» | API-ключ Маркета; MCP `yandex-market` |
| [bitrix24-leads](skills/bitrix24-leads/SKILL.md) | новые лиды, дубли, лид из письма, задача менеджеру, сводка | MCP `bitrix24`, входящий вебхук |
| [amocrm-followup](skills/amocrm-followup/SKILL.md) | зависшие сделки, follow-up по этапу воронки, примечания и задачи | MCP `amocrm`, долгосрочный токен |
| [avito-replies](skills/avito-replies/SKILL.md) | ответы в чатах Авито по правилам продавца, спам — человеку | MCP `avito`, «API для бизнеса» |
| [yookassa-sbp](skills/yookassa-sbp/SKILL.md) | оплата ЮKassa и СБП в коде: платёж, вебхук, чек 54-ФЗ, возвраты | shopId и секретный ключ ЮKassa |
| [tz-from-chat](skills/tz-from-chat/SKILL.md) | техническое задание из переписки с заказчиком | — |
| [ru-legal-docs](skills/ru-legal-docs/SKILL.md) | договор оказания услуг и публичная оферта по шаблонам РФ | — |
| [tkbk-setup](skills/tkbk-setup/SKILL.md) | подключение любого инструмента к шлюзу TKBK, проверка ключа | ключ TKBK `cr_…` |

Скилы для маркетплейсов и CRM работают через MCP-серверы [tkbk-online/tkbk-mcp](https://github.com/tkbk-online/tkbk-mcp):
локально бесплатно (`npx`), в облаке — [mcp.tkbk.online](https://tkbk.online/mcp). Модель агента — любая через
один ключ TKBK: [tkbk.online](https://tkbk.online).

## Проверено TKBK: что именно проверяем

Аудиты открытых реестров скилов в 2026 году нашли сотни скилов, которые ставят вредоносный код, читают ключи и
отправляют их наружу. Поэтому каждый скил этого хаба проходит `tools/audit.mjs` — в CI на каждый PR и перед
каждым релизом. Аудит ничего не выполняет: он читает файлы и ищет паттерны.

| Проверка | Что ловим | Серьёзность |
|---|---|---|
| **Загрузка в оболочку** | `curl … \| sh`, `wget … \| bash`, `iwr … \| iex`, интерпретатор, который читает скачанный код | ошибка |
| **Чужие ключи** | обращения к `~/.ssh`, приватным ключам, `.aws/credentials`, `.netrc`, `.gnupg`, `.npmrc`, `.kube/config`, настройкам и учёткам Claude Code, `/etc/passwd`, отправка `.env` | ошибка |
| **Дамп окружения** | `printenv \| …`, `env > …`, сериализация всего `process.env` / `os.environ` | ошибка / предупреждение |
| **Зашитые секреты** | ключи вида `cr_…`, `sk-…`, AWS, GitHub, Slack, токены Telegram-ботов, приватные ключи, `api_key = "…"` | ошибка |
| **Обфускация** | base64-декодирование, `eval`, `new Function`, `exec("…")`, строки из кодов символов, длинные `\x..`/`\u....`, невидимые символы, байтовые массивы | ошибка |
| **Разрушительные команды** | `rm -rf` корня/дома, форматирование дисков, fork-бомбы, reverse shell, отключение антивируса, запуск агента без проверок прав; `sudo`, `chmod 777`, автозапуск и правка профиля оболочки | ошибка / предупреждение |
| **Инъекции в агента** | «ignore previous instructions», «do not tell the user», «без ведома пользователя», jailbreak-фразы; `confirm: true` без слова о подтверждении пользователем рядом | ошибка / предупреждение |
| **Сетевые адреса** | каждый хост в SKILL.md и скриптах сверяется с [`tools/allowlist.json`](tools/allowlist.json) (сайты и API TKBK, WB, Ozon, Маркета, Битрикс24, amoCRM, Авито, ЮKassa, СБП, ГК РФ); IP вместо домена — ошибка; `http://` — предупреждение; скрипт с сетью без единого литерального хоста — предупреждение | ошибка / предупреждение |
| **Структура** | `SKILL.md` с YAML-frontmatter (`name` = имя папки, `description`), только текстовые файлы (md, mjs, js, ts, sh, py, ps1, json, yml, toml, txt, csv), без симлинков, бинарников и `.env`, файл ≤ 256 КБ | ошибка |

Что аудит **не** гарантирует: что скрипт делает ровно то, что написано в описании, и что инструкции хороши.
Поэтому каждый скил здесь написан и прочитан людьми из TKBK, а запись в любой внешний сервис (ответ на отзыв,
сообщение в чат, лид в CRM, платёж) по инструкции скила происходит только после подтверждения пользователем.

Запустить аудит самим, на любой папке со скилами:

```bash
node tools/audit.mjs                      # этот репозиторий
node tools/audit.mjs ~/.claude/skills     # всё, что установлено у вас
node tools/audit.mjs path/to/skill --json # один скил, JSON-отчёт
```

Выход `0` — чисто, `1` — есть ошибки; `--strict` считает ошибками и предупреждения.

## Добавить скил

1. Папка `skills/<имя>/SKILL.md` (имя — строчные буквы, цифры, дефис), в frontmatter `name` и `description`,
   описание на русском с фразами, по которым агент должен применять скил. Скрипты — в `scripts/`, шаблоны — в
   `templates/`.
2. Любая запись во внешний сервис — только с подтверждением пользователя; ключи — только из переменных окружения.
3. Новые хосты — в `tools/allowlist.json` с причиной.
4. `npm test` зелёный, PR. Аудит в CI обязателен.

## Лицензия

MIT. Скилы для маркетплейсов работают с серверами [tkbk-mcp](https://github.com/tkbk-online/tkbk-mcp) (тоже MIT).

---

## English

**TKBK Skills Hub** — audited `SKILL.md` skills for AI agents on the Russian market: Wildberries reviews, Ozon
questions, Yandex Market stock alerts, Bitrix24 leads, amoCRM follow-ups, Avito chats, YooKassa/SBP payments, a
technical specification from a chat, Russian contract and public offer templates, and connecting any tool to the TKBK
gateway (one key for Claude, GPT, DeepSeek, GLM and Grok).

Format: [agent skills](https://github.com/vercel-labs/skills) — `skills/<name>/SKILL.md` with YAML front matter.
Works in Claude Code, Cursor, Codex CLI, Cline, OpenCode and TKBK Agent (`.tkbk/skills`, `~/.tkbk/skills`).

```bash
npx skills add tkbk-online/skills --skill wb-reviews
npx skills add tkbk-online/skills --list
```

| Skill | What it does | Needs |
|---|---|---|
| [wb-reviews](skills/wb-reviews/SKILL.md) | answers Wildberries customer reviews: fetch → drafts → approval → publish | MCP `wb` ([tkbk-mcp](https://github.com/tkbk-online/tkbk-mcp)) |
| [ozon-questions](skills/ozon-questions/SKILL.md) | answers product questions on Ozon through the Seller API | Ozon Client-Id / Api-Key |
| [yandex-market-stock](skills/yandex-market-stock/SKILL.md) | Yandex Market stock, days of cover, reorder alerts | Market API key, MCP `yandex-market` |
| [bitrix24-leads](skills/bitrix24-leads/SKILL.md) | new leads, duplicates, lead from an e-mail, task for a manager | MCP `bitrix24` |
| [amocrm-followup](skills/amocrm-followup/SKILL.md) | stale deals, stage-aware follow-ups, notes and tasks | MCP `amocrm` |
| [avito-replies](skills/avito-replies/SKILL.md) | replies in Avito chats by the seller's rules | MCP `avito` |
| [yookassa-sbp](skills/yookassa-sbp/SKILL.md) | YooKassa and SBP payments in code: payment, webhook, receipt, refunds | YooKassa shop |
| [tz-from-chat](skills/tz-from-chat/SKILL.md) | technical specification out of a customer chat | — |
| [ru-legal-docs](skills/ru-legal-docs/SKILL.md) | Russian service contract and public offer templates | — |
| [tkbk-setup](skills/tkbk-setup/SKILL.md) | connect Claude Code, Codex, Cursor, n8n, SDKs to the TKBK gateway | TKBK key |

**Verified by TKBK.** Every skill passes `tools/audit.mjs` in CI on each PR: pipe-to-shell installers, reads of
SSH/cloud/agent credentials, environment dumps, hard-coded secrets, obfuscation (base64, eval, hidden characters),
destructive commands, prompt injection against the agent, and every network host checked against
`tools/allowlist.json`. Writes to external services happen only after the user confirms. Run it on your own skills:
`node tools/audit.mjs ~/.claude/skills`.

License MIT · [tkbk.online/skills](https://tkbk.online/skills)
