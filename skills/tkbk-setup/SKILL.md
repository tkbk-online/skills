---
name: tkbk-setup
description: Подключение любого инструмента к шлюзу TKBK (api.tkbk.online, один ключ cr_… для Claude, GPT, DeepSeek, GLM, Grok) — Claude Code, Codex CLI, Cursor, Cline, Kilo Code, Zed, JetBrains/Continue, Aider, n8n, Dify, Open WebUI, OpenCode, Chatbox, SDK Anthropic/OpenAI, curl; выбор base URL по формату API, проверка ключа скриптом scripts/tkbk-check.mjs, разбор ошибок 401/402/404/429. Применяй, когда просят «подключи TKBK», «настрой Claude Code / Cursor / Codex на TKBK», «какой base URL», «не работает ключ cr_».
license: MIT
metadata:
  author: TKBK
  version: "1.0"
  verified: "2026-10-15"
  tags: tkbk, настройка, claude code, cursor, codex, base url, api key
---

# Подключение инструментов к TKBK

TKBK — единый API-шлюз: один ключ `cr_…` и один хост `https://api.tkbk.online` для Claude, GPT, DeepSeek, GLM
и Grok. Клиент не меняется — меняются **base URL и ключ**. Скил подбирает правильный адрес под инструмент,
прописывает настройки и проверяет, что запросы ходят.

## Когда применять

- «Подключи Claude Code / Cursor / Codex / n8n к TKBK», «какой base URL указать».
- «Ключ не работает», «401», «404 model not found», «запросы уходят на api.anthropic.com».
- «Какую модель выбрать» — направь на каталог, не выбирай за пользователя.

## Три формата — три адреса

| Формат API | Base URL | Кто его использует | Ключ в |
|---|---|---|---|
| Anthropic Messages | `https://api.tkbk.online` (без `/v1` — клиент добавит `/v1/messages` сам) | Claude Code, Anthropic SDK, Cline/Kilo в режиме Anthropic, Zed | `ANTHROPIC_AUTH_TOKEN` или `x-api-key` |
| OpenAI Chat Completions | `https://api.tkbk.online/v1` | OpenAI SDK, n8n, Dify, Open WebUI, Cursor, Cline/Kilo в режиме OpenAI Compatible, Aider, JetBrains/Continue | `OPENAI_API_KEY` / `Authorization: Bearer` |
| OpenAI Responses | `https://api.tkbk.online/openai/v1` | Codex CLI, OpenCode, Cursor (Override OpenAI Base URL) | `OPENAI_API_KEY` |

Оба способа передачи ключа работают на всех путях: `Authorization: Bearer cr_…` или `x-api-key: cr_…`.
Список моделей — `GET https://api.tkbk.online/v1/models` с ключом или https://tkbk.online/models. Алиасы
`tkbk-smart`, `tkbk-fast`, `tkbk-cheap` — шлюз сам выберет доступную модель уровня.

## Порядок работы

1. **Узнай инструмент и ОС.** Если ключа у пользователя ещё нет — https://tkbk.online/account (пробный ключ после
   входа) или https://tkbk.online/buy. Сам ключ в чат просить не нужно: пользователь вставляет его в конфиг или
   переменную окружения.
2. **Проверь связь** без ключа: `curl -s https://api.tkbk.online/health` → `{"status":"ok"}`.
3. **Пропиши настройки** из таблицы ниже. Не ставь одновременно `ANTHROPIC_API_KEY` и `ANTHROPIC_AUTH_TOKEN` —
   только второй. На Windows переменные уровня User применяются после перезапуска терминала.
4. **Проверь ключ**: `node scripts/tkbk-check.mjs` (читает `TKBK_API_KEY`, иначе `ANTHROPIC_AUTH_TOKEN`, иначе
   `OPENAI_API_KEY`; печатает только маску ключа). С `--chat` отправит одно короткое сообщение модели `tkbk-cheap` и
   покажет ответ и расход токенов.
5. **Первый запрос в самом инструменте** и проверка расхода в кабинете https://tkbk.online/dashboard/usage.

## Настройки по инструментам

**Claude Code** — переменные окружения или `~/.claude/settings.json`:
```bash
export ANTHROPIC_BASE_URL="https://api.tkbk.online"
export ANTHROPIC_AUTH_TOKEN="cr_xxx"
export ANTHROPIC_MODEL="claude-sonnet-5"        # опционально
```
```json
{ "env": { "ANTHROPIC_BASE_URL": "https://api.tkbk.online", "ANTHROPIC_AUTH_TOKEN": "cr_xxx" }, "model": "claude-sonnet-5" }
```
Windows PowerShell: `[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://api.tkbk.online", "User")`
и так же для `ANTHROPIC_AUTH_TOKEN`, затем перезапустить терминал.

**Codex CLI** — `~/.codex/config.toml` (суффикс `/openai/v1` обязателен):
```toml
model = "gpt-5.6-sol"
model_provider = "tkbk"

[model_providers.tkbk]
name = "TKBK"
base_url = "https://api.tkbk.online/openai/v1"
env_key = "OPENAI_API_KEY"
```
и `export OPENAI_API_KEY="cr_xxx"`.

**Cursor** — Settings → Models: включить *Override OpenAI Base URL* = `https://api.tkbk.online/openai/v1`, в поле
OpenAI API Key вставить `cr_xxx`, нажать *Verify*, оставить включёнными только модели из каталога TKBK
(добавить кастомную модель по id, например `gpt-6.1-sol`).

**Cline / Kilo Code / Roo** — провайдер *Anthropic*: base URL `https://api.tkbk.online`, ключ `cr_xxx`, модель
`claude-sonnet-5`; или провайдер *OpenAI Compatible*: base URL `https://api.tkbk.online/v1`, ключ, id модели.

**Zed** — `settings.json` → `language_models.anthropic.api_url: "https://api.tkbk.online"`, ключ через
`ANTHROPIC_API_KEY` (у Zed это имя переменной ключа) или в настройках ассистента.

**JetBrains / VS Code через Continue** — `~/.continue/config.yaml`: провайдер `anthropic` с `apiBase:
https://api.tkbk.online/v1` и `apiKey: cr_xxx`; провайдер `openai` с тем же `apiBase` для GPT/DeepSeek/GLM.

**Aider** — `OPENAI_API_BASE=https://api.tkbk.online/v1`, `OPENAI_API_KEY=cr_xxx`, модель `--model openai/gpt-5.6-sol`
(префикс `openai/` обязателен для совместимого провайдера); для Claude — `ANTHROPIC_BASE_URL` и `--model claude-sonnet-5`.

**n8n** — Credentials → OpenAI API: API Key `cr_xxx`, Base URL `https://api.tkbk.online/v1`; в ноде OpenAI /
AI Agent выбрать модель по id. Для Anthropic Chat Model — credential Anthropic с Base URL `https://api.tkbk.online`.

**Dify / Open WebUI / LibreChat** — провайдер *OpenAI-API-compatible*: base `https://api.tkbk.online/v1`, ключ,
список моделей — вручную по id.

**OpenCode** — `opencode.json`, провайдер `@ai-sdk/openai-compatible` с `baseURL: "https://api.tkbk.online/openai/v1"`.

**Chatbox** — Custom Provider: API Host `https://api.tkbk.online/openai` (путь `/v1/chat/completions` добавится сам).

**NextChat** — `BASE_URL=https://api.tkbk.online/openai`; **LobeChat** — `OPENAI_PROXY_URL=https://api.tkbk.online/openai/v1`;
список моделей через `CUSTOM_MODELS` / `OPENAI_MODEL_LIST` с префиксом `+`.

**SDK**
```python
from anthropic import Anthropic
client = Anthropic(base_url="https://api.tkbk.online", api_key=os.environ["TKBK_API_KEY"])

from openai import OpenAI
client = OpenAI(base_url="https://api.tkbk.online/v1", api_key=os.environ["TKBK_API_KEY"])
```
```ts
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic({ baseURL: "https://api.tkbk.online", apiKey: process.env.TKBK_API_KEY });
```

**curl**
```bash
curl https://api.tkbk.online/v1/messages -H "Authorization: Bearer $TKBK_API_KEY" -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-5","max_tokens":64,"messages":[{"role":"user","content":"ping"}]}'
```

MCP-серверы для маркетплейсов и CRM (Wildberries, Ozon, Яндекс Маркет, Авито, Битрикс24, amoCRM) — отдельно:
https://tkbk.online/mcp и скилы `wb-reviews`, `ozon-questions`, `yandex-market-stock`, `avito-replies`,
`bitrix24-leads`, `amocrm-followup` этого хаба.

## Ошибки

| Симптом | Причина | Решение |
|---|---|---|
| `401 invalid api key` | ключ с опечаткой, лишний `Bearer ` в значении переменной, или задан старый `ANTHROPIC_API_KEY` | ключ ровно `cr_…`; убрать лишние переменные; перезапустить терминал |
| `402` | баланс ключа исчерпан | пополнить https://tkbk.online/dashboard/billing |
| `404 model not found` | id модели не из каталога или лишний/недостающий `/v1` в base URL | сверить id с `/v1/models`; адрес по таблице выше |
| `404` на любой запрос | в Anthropic-клиент прописан адрес с `/v1` | убрать `/v1` из `ANTHROPIC_BASE_URL` |
| `429` | дневной лимит ключа или частота | подождать `Retry-After`; лимит — в кабинете |
| запросы уходят на api.anthropic.com | переменная не подхвачена | `echo $ANTHROPIC_BASE_URL`, перезапуск |
| Cursor: Verify красный | не тот адрес | должно быть ровно `https://api.tkbk.online/openai/v1` |

## Ссылки

- Интеграции с пошаговыми инструкциями: https://tkbk.online/integrations
- Документация: https://tkbk.online/docs · эндпоинты https://tkbk.online/docs/getting-started/endpoints
- Модели и цены: https://tkbk.online/models · ошибки: https://tkbk.online/errors
