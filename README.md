# TKBK Skills Hub

Проверенные скилы для ИИ-агентов: свои — под российский рынок (маркетплейсы, CRM, Авито, ЮKassa, документы,
подключение к TKBK), импортированные — официальные скилы Anthropic (Claude), OpenAI (Codex), DeepSeek, Z.ai (GLM)
и лучшие инженерные практики (Vercel, superpowers, Addy Osmani). Формат — `SKILL.md`
([стандарт agent skills](https://github.com/vercel-labs/skills)): работает в Claude Code, Cursor, Codex CLI, Cline,
OpenCode, TKBK Agent и любом агенте, который читает папки `skills/`.

Витрина каталога: [index.html](index.html) · данные: [catalog.json](catalog.json) · [English below](#english)

## Установка

```bash
# один скил в проект (Claude Code → .claude/skills/, Cursor и Codex → .agents/skills/)
npx skills add tkbk-online/skills --skill wb-reviews

# несколько, глобально, без вопросов
npx skills add tkbk-online/skills --skill wb-reviews --skill systematic-debugging -g -y

# посмотреть список
npx skills add tkbk-online/skills --list
```

Флаг `-a claude-code` / `-a cursor` / `-a codex` выбирает агента. Папка категории (`skills/<категория>/<скил>`)
на команду не влияет — скил называется по имени. TKBK Agent читает скилы из `.tkbk/skills` проекта и
`~/.tkbk/skills` — скопируйте туда папку скила. Без CLI: скопировать `skills/<категория>/<имя>/` в папку скилов
вашего агента.

Скилы для маркетплейсов и CRM работают через MCP-серверы [tkbk-online/tkbk-mcp](https://github.com/tkbk-online/tkbk-mcp):
локально бесплатно (`npx`), в облаке — [mcp.tkbk.online](https://tkbk.online/mcp). Модель агента — любая через
один ключ TKBK: [tkbk.online](https://tkbk.online).

## Каталог

<!-- catalog:start -->
Всего **59** скилов в каталоге (10 своих, 49 импортированных) и 7 ссылок на скилы, которые ставятся из исходного репозитория. Установка любого: `npx skills add tkbk-online/skills --skill <имя>`.

### TKBK — российские сервисы

Свои скилы TKBK: маркетплейсы, CRM, Авито, ЮKassa, документы, подключение к шлюзу. Работают через MCP tkbk-online/tkbk-mcp.

| Скил | Что делает | Источник | Лицензия | Проверка |
|---|---|---|---|---|
| [amocrm-followup](skills/tkbk/amocrm-followup/SKILL.md) | Находит сделки amoCRM без движения N дней, пишет персональное сообщение под этап воронки, добавляет примечание и ставит задачу менеджеру. | TKBK | MIT | ✅ 2026-10-15 |
| [avito-replies](skills/tkbk/avito-replies/SKILL.md) | Разбирает непрочитанные чаты Авито по объявлениям, отвечает о наличии, цене, адресе и торге по правилам продавца; мошенников и споры отдаёт человеку. | TKBK | MIT | ✅ 2026-10-15 |
| [bitrix24-leads](skills/tkbk/bitrix24-leads/SKILL.md) | Сводка новых лидов Битрикс24, поиск дублей по телефону и почте, лид из письма или переписки, задача менеджеру со сроком. | TKBK | MIT | ✅ 2026-10-15 |
| [ozon-questions](skills/tkbk/ozon-questions/SKILL.md) | Новые вопросы в карточках Ozon через Seller API, ответы с опорой на остатки и характеристики, публикация после подтверждения; скрипт в комплекте. | TKBK | MIT | ✅ 2026-10-15 |
| [ru-legal-docs](skills/tkbk/ru-legal-docs/SKILL.md) | Договор возмездного оказания услуг и публичная оферта по шаблонам РФ с реквизитами, НДС/УСН, 152-ФЗ и ЗоЗПП; чек-лист проверки чужого договора. | TKBK | MIT | ✅ 2026-10-15 |
| [tkbk-setup](skills/tkbk/tkbk-setup/SKILL.md) | Base URL и ключ TKBK для Claude Code, Codex, Cursor, Cline, Zed, n8n, Dify, SDK и curl; проверка ключа скриптом; разбор ошибок 401, 402, 404, 429. | TKBK | MIT | ✅ 2026-10-15 |
| [tz-from-chat](skills/tkbk/tz-from-chat/SKILL.md) | Превращает переписку с заказчиком в техническое задание: цели, роли, сценарии, требования MoSCoW, интеграции, критерии приёмки, открытые вопросы. | TKBK | MIT | ✅ 2026-10-15 |
| [wb-reviews](skills/tkbk/wb-reviews/SKILL.md) | Забирает отзывы Wildberries без ответа, группирует по оценкам и товарам, пишет ответы по правилам WB и публикует только утверждённые. | TKBK | MIT | ✅ 2026-10-15 |
| [yandex-market-stock](skills/tkbk/yandex-market-stock/SKILL.md) | Остатки Яндекс Маркета по складам и оборачиваемость, продажи за 14 дней, дни запаса по каждому SKU и список «пора дозаказать». | TKBK | MIT | ✅ 2026-10-15 |
| [yookassa-sbp](skills/tkbk/yookassa-sbp/SKILL.md) | Оплата ЮKassa и СБП в коде: создание платежа, страница оплаты, вебхук с проверкой IP и статуса, чек 54-ФЗ, возвраты, тестовый магазин; скрипт для проверки. | TKBK | MIT | ✅ 2026-10-15 |

### Claude

Официальные скилы Anthropic для Claude и Claude Code.

| Скил | Что делает | Источник | Лицензия | Проверка |
|---|---|---|---|---|
| [frontend-design](skills/claude/frontend-design/SKILL.md) | Интерфейсы с характером: дизайн-направление, типографика, цвет, движение — без «шаблонного вида ИИ». | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e10/skills/frontend-design) | Apache-2.0 | ✅ 2026-10-15 |
| [internal-comms](skills/claude/internal-comms/SKILL.md) | Внутренние коммуникации компании: статусы, отчёты, объявления, FAQ, записки руководству. | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e10/skills/internal-comms) | Apache-2.0 | ✅ 2026-10-15 |
| [mcp-builder](skills/claude/mcp-builder/SKILL.md) | Создание MCP-серверов: проектирование инструментов, SDK на TypeScript и Python, тестирование. | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e10/skills/mcp-builder) | Apache-2.0 | ✅ 2026-10-15 |
| [skill-creator](skills/claude/skill-creator/SKILL.md) | Создание и улучшение скилов: структура SKILL.md, проверка срабатывания, оценка качества. | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e10/skills/skill-creator) | Apache-2.0 | ✅ 2026-10-15 · ⚠️ 3 |
| [theme-factory](skills/claude/theme-factory/SKILL.md) | Готовые темы оформления (палитры и шрифты) для презентаций, документов и веб-артефактов. | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e10/skills/theme-factory) | Apache-2.0 | ✅ 2026-10-15 |
| [webapp-testing](skills/claude/webapp-testing/SKILL.md) | Тестирование веб-приложений через Playwright: запуск, сценарии, скриншоты, логи браузера. | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e10/skills/webapp-testing) | Apache-2.0 | ✅ 2026-10-15 · ⚠️ 1 |
| [claude-api](https://github.com/anthropics/skills/tree/main/skills/claude-api) ↗ | Справочник по Claude API и SDK (2 МБ, 90 файлов): Messages API, инструменты, стриминг, оценки. Слишком велик для копии — ставится из репозитория Anthropic; формат тот же через шлюз TKBK. | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/claude-api) | Apache-2.0 | ссылка, не копируется |
| [docx](https://github.com/anthropics/skills/tree/main/skills/docx) ↗ | Документы Word: создание, правка, отслеживание изменений. Лицензия не разрешает копировать — ставится из репозитория Anthropic. | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/docx) | Proprietary (Anthropic) | ссылка, не копируется |
| [pdf](https://github.com/anthropics/skills/tree/main/skills/pdf) ↗ | PDF: чтение, объединение, формы, OCR. Ставится из репозитория Anthropic. | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/pdf) | Proprietary (Anthropic) | ссылка, не копируется |
| [pptx](https://github.com/anthropics/skills/tree/main/skills/pptx) ↗ | Презентации PowerPoint: создание и правка по шаблону. Ставится из репозитория Anthropic. | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/pptx) | Proprietary (Anthropic) | ссылка, не копируется |
| [xlsx](https://github.com/anthropics/skills/tree/main/skills/xlsx) ↗ | Таблицы Excel: формулы, форматирование, анализ. Ставится из репозитория Anthropic. | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/xlsx) | Proprietary (Anthropic) | ссылка, не копируется |

### GPT / Codex

Каталог скилов OpenAI для Codex CLI; работают и в других агентах.

| Скил | Что делает | Источник | Лицензия | Проверка |
|---|---|---|---|---|
| [cli-creator](skills/gpt-codex/cli-creator/SKILL.md) | Проектирование и создание CLI-утилит: команды, флаги, вывод, тесты. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/cli-creator) | Apache-2.0 | ✅ 2026-10-15 |
| [define-goal](skills/gpt-codex/define-goal/SKILL.md) | Формулировка цели задачи до начала работы: критерии готовности, ограничения, проверка. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/define-goal) | Apache-2.0 | ✅ 2026-10-15 |
| [gh-address-comments](skills/gpt-codex/gh-address-comments/SKILL.md) | Ответы на замечания ревьюеров в pull request и правки по ним. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/gh-address-comments) | Apache-2.0 | ✅ 2026-10-15 |
| [gh-fix-ci](skills/gpt-codex/gh-fix-ci/SKILL.md) | Починка упавшего CI в GitHub Actions: разбор логов, причина, точечный фикс. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/gh-fix-ci) | Apache-2.0 | ✅ 2026-10-15 · ⚠️ 1 |
| [jupyter-notebook](skills/gpt-codex/jupyter-notebook/SKILL.md) | Работа с Jupyter-ноутбуками: запуск ячеек, правка, анализ данных. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/jupyter-notebook) | Apache-2.0 | ✅ 2026-10-15 |
| [linear](skills/gpt-codex/linear/SKILL.md) | Задачи Linear: создание, статусы, связь с кодом. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/linear) | Apache-2.0 | ✅ 2026-10-15 |
| [migrate-to-codex](skills/gpt-codex/migrate-to-codex/SKILL.md) | Перенос конфигурации и правил из других агентов в Codex CLI. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/migrate-to-codex) | Apache-2.0 | ✅ 2026-10-15 |
| [openai-docs](skills/gpt-codex/openai-docs/SKILL.md) | Поиск по документации OpenAI API (Responses, Chat Completions) — формат совместим со шлюзом TKBK. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/openai-docs) | Apache-2.0 | ✅ 2026-10-15 |
| [playwright](skills/gpt-codex/playwright/SKILL.md) | Автоматизация браузера через Playwright: тесты, обход страниц, скриншоты. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/playwright) | Apache-2.0 | ✅ 2026-10-15 |
| [security-best-practices](skills/gpt-codex/security-best-practices/SKILL.md) | Проверка безопасности кода по языку и фреймворку: уязвимости, отчёт, исправления. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/security-best-practices) | Apache-2.0 | ✅ 2026-10-15 · ⚠️ 24 |
| [security-ownership-map](skills/gpt-codex/security-ownership-map/SKILL.md) | Карта ответственности за безопасность по частям репозитория. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/security-ownership-map) | Apache-2.0 | ✅ 2026-10-15 |
| [security-threat-model](skills/gpt-codex/security-threat-model/SKILL.md) | Модель угроз для системы или фичи: активы, границы доверия, риски, меры. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/security-threat-model) | Apache-2.0 | ✅ 2026-10-15 |
| [vercel-deploy](skills/gpt-codex/vercel-deploy/SKILL.md) | Деплой проекта на Vercel из агента. | [openai/skills](https://github.com/openai/skills/tree/49f948faa925/skills/.curated/vercel-deploy) | MIT | ✅ 2026-10-15 |

### DeepSeek

Переносимые скилы из DeepSeek Harness (dsh).

| Скил | Что делает | Источник | Лицензия | Проверка |
|---|---|---|---|---|
| [dsh-error-handling](skills/deepseek/dsh-error-handling/SKILL.md) | Принципы обработки ошибок: классификация сбоев, повторы, фоновые задачи, понятные сообщения пользователю. | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness/tree/86a402200d95/.agents/skills/dsh-error-handling) | MIT | ✅ 2026-10-15 · ⚠️ 1 |
| [dsh-find-simplifications](skills/deepseek/dsh-find-simplifications/SKILL.md) | Поиск обоснованных упрощений: мёртвый и дублирующий код, лишние абстракции, конфигурация, тесты. | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness/tree/86a402200d95/.agents/skills/dsh-find-simplifications) | MIT | ✅ 2026-10-15 |
| [dsh-trim-cot-leakage](skills/deepseek/dsh-trim-cot-leakage/SKILL.md) | Чистка текстов от «утечки рассуждений»: ссылки на черновики, историю решений, «раньше было» — в документации и комментариях. | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness/tree/86a402200d95/.agents/skills/dsh-trim-cot-leakage) | MIT | ✅ 2026-10-15 |
| [record-browser-gif](skills/deepseek/record-browser-gif/SKILL.md) | Запись GIF-демо интерфейса через браузер или Playwright и прикрепление к pull request. | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness/tree/86a402200d95/.agents/skills/record-browser-gif) | MIT | ✅ 2026-10-15 · ⚠️ 1 |
| [skills](https://github.com/deepseek-ai/deepseek-harness/tree/main/.agents/skills) ↗ | Остальные скилы DeepSeek Harness (ревью, CI, UI, документация) — привязаны к их репозиторию, ставятся оттуда. | [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness/tree/main/.agents/skills) | MIT | ссылка, не копируется |

### GLM

Официальные скилы Z.ai для моделей GLM; скрипты зовут API Z.ai напрямую (ключ ZHIPUAI_API_KEY).

| Скил | Что делает | Источник | Лицензия | Проверка |
|---|---|---|---|---|
| [glm-master-skill](skills/glm/glm-master-skill/SKILL.md) | Обзор официальных скилов GLM и способы установки (только документация). | [zai-org/GLM-skills](https://github.com/zai-org/GLM-skills/tree/2ecd31c37e75/skills/glm-master-skill) | Apache-2.0 | ✅ 2026-10-15 |
| [glmocr-sdk](skills/glm/glmocr-sdk/SKILL.md) | OCR документов через GLM-OCR SDK: текст, таблицы, формулы. | [zai-org/GLM-skills](https://github.com/zai-org/GLM-skills/tree/2ecd31c37e75/skills/glmocr-sdk) | Apache-2.0 | ✅ 2026-10-15 |
| [glmv-doc-based-writing](skills/glm/glmv-doc-based-writing/SKILL.md) | Написание текстов на основе загруженных документов с сохранением фактов и структуры. | [zai-org/GLM-skills](https://github.com/zai-org/GLM-skills/tree/2ecd31c37e75/skills/glmv-doc-based-writing) | Apache-2.0 | ✅ 2026-10-15 |
| [glmv-prd-to-app](skills/glm/glmv-prd-to-app/SKILL.md) | Полноценное веб-приложение из PRD и прототипов: схема БД, API, фронтенд, проверка по макетам, деплой-скрипт. | [zai-org/GLM-skills](https://github.com/zai-org/GLM-skills/tree/2ecd31c37e75/skills/glmv-prd-to-app) | Apache-2.0 | ✅ 2026-10-15 · ⚠️ 1 |
| [glmv-prompt-gen](skills/glm/glmv-prompt-gen/SKILL.md) | Генерация промптов для изображений и видео по описанию или референсу. | [zai-org/GLM-skills](https://github.com/zai-org/GLM-skills/tree/2ecd31c37e75/skills/glmv-prompt-gen) | Apache-2.0 | ✅ 2026-10-15 |
| [glmv-resume-screen](skills/glm/glmv-resume-screen/SKILL.md) | Скрининг резюме под вакансию: извлечение данных, оценка соответствия, отчёт. | [zai-org/GLM-skills](https://github.com/zai-org/GLM-skills/tree/2ecd31c37e75/skills/glmv-resume-screen) | Apache-2.0 | ✅ 2026-10-15 |
| [glmv-web-replication](skills/glm/glmv-web-replication/SKILL.md) | Воспроизведение веб-страницы по скриншоту: вёрстка и стили. | [zai-org/GLM-skills](https://github.com/zai-org/GLM-skills/tree/2ecd31c37e75/skills/glmv-web-replication) | Apache-2.0 | ✅ 2026-10-15 · ⚠️ 6 |

### Grok

У xAI пока нет каталога SKILL.md — ссылки на официальные инструменты.

| Скил | Что делает | Источник | Лицензия | Проверка |
|---|---|---|---|---|
| [grok-build](https://github.com/xai-org/grok-build-plugin-cc/tree/main/plugins/grok-build) ↗ | Плагин Claude Code от xAI: делегирование ревью и «спасательных» задач Grok Build CLI (формат плагина, не SKILL.md). | [xai-org/grok-build-plugin-cc](https://github.com/xai-org/grok-build-plugin-cc/tree/main/plugins/grok-build) | Apache-2.0 | ссылка, не копируется |

### Универсальные

Инженерные практики для любой модели: ревью, отладка, TDD, планирование, React и дизайн.

| Скил | Что делает | Источник | Лицензия | Проверка |
|---|---|---|---|---|
| [api-and-interface-design](skills/universal/api-and-interface-design/SKILL.md) | Проектирование API и интерфейсов модулей: контракты, версии, ошибки, обратная совместимость. | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/aeac41d4d005/skills/api-and-interface-design) | MIT | ✅ 2026-10-15 |
| [brainstorming](skills/universal/brainstorming/SKILL.md) | Брейншторм перед реализацией: вопросы заказчику, варианты, выбор подхода до написания кода. | [obra/superpowers](https://github.com/obra/superpowers/tree/bb92a7774141/skills/brainstorming) | MIT | ✅ 2026-10-15 · ⚠️ 2 · принято 1 |
| [code-review-and-quality](skills/universal/code-review-and-quality/SKILL.md) | Код-ревью по пяти осям: корректность, читаемость, архитектура, безопасность, производительность. | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/aeac41d4d005/skills/code-review-and-quality) | MIT | ✅ 2026-10-15 |
| [debugging-and-error-recovery](skills/universal/debugging-and-error-recovery/SKILL.md) | Отладка и восстановление после ошибок: воспроизведение, изоляция, защита от повторения. | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/aeac41d4d005/skills/debugging-and-error-recovery) | MIT | ✅ 2026-10-15 · ⚠️ 1 |
| [documentation-and-adrs](skills/universal/documentation-and-adrs/SKILL.md) | Документация и ADR: фиксировать решения, README, которые читают. | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/aeac41d4d005/skills/documentation-and-adrs) | MIT | ✅ 2026-10-15 |
| [executing-plans](skills/universal/executing-plans/SKILL.md) | Выполнение готового плана задача за задачей с фиксацией результата и ревью. | [obra/superpowers](https://github.com/obra/superpowers/tree/bb92a7774141/skills/executing-plans) | MIT | ✅ 2026-10-15 |
| [performance-optimization](skills/universal/performance-optimization/SKILL.md) | Оптимизация производительности: измерить, найти узкое место, исправить, подтвердить цифрами. | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/aeac41d4d005/skills/performance-optimization) | MIT | ✅ 2026-10-15 |
| [planning-and-task-breakdown](skills/universal/planning-and-task-breakdown/SKILL.md) | Планирование и декомпозиция задач на проверяемые шаги. | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/aeac41d4d005/skills/planning-and-task-breakdown) | MIT | ✅ 2026-10-15 |
| [requesting-code-review](skills/universal/requesting-code-review/SKILL.md) | Запрос код-ревью: что проверять, в каком контексте, формат ответа. | [obra/superpowers](https://github.com/obra/superpowers/tree/bb92a7774141/skills/requesting-code-review) | MIT | ✅ 2026-10-15 |
| [security-and-hardening](skills/universal/security-and-hardening/SKILL.md) | Усиление безопасности: входные данные, секреты, зависимости, права, логирование. | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills/tree/aeac41d4d005/skills/security-and-hardening) | MIT | ✅ 2026-10-15 · ⚠️ 1 |
| [systematic-debugging](skills/universal/systematic-debugging/SKILL.md) | Системная отладка: сначала корневая причина, потом исправление; воспроизведение, гипотезы, проверка. | [obra/superpowers](https://github.com/obra/superpowers/tree/bb92a7774141/skills/systematic-debugging) | MIT | ✅ 2026-10-15 · ⚠️ 2 |
| [test-driven-development](skills/universal/test-driven-development/SKILL.md) | TDD: красный тест → минимальный код → рефакторинг; запрещает писать код без падающего теста. | [obra/superpowers](https://github.com/obra/superpowers/tree/bb92a7774141/skills/test-driven-development) | MIT | ✅ 2026-10-15 |
| [using-git-worktrees](skills/universal/using-git-worktrees/SKILL.md) | Изолированная работа в git worktree: ветка на задачу, без конфликтов с основной копией. | [obra/superpowers](https://github.com/obra/superpowers/tree/bb92a7774141/skills/using-git-worktrees) | MIT | ✅ 2026-10-15 |
| [vercel-composition-patterns](skills/universal/vercel-composition-patterns/SKILL.md) | Паттерны композиции React-компонентов: compound components, слоты, контекст без prop drilling. | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4/skills/composition-patterns) | MIT | ✅ 2026-10-15 |
| [vercel-react-best-practices](skills/universal/vercel-react-best-practices/SKILL.md) | 70 правил производительности React и Next.js от Vercel: водопады запросов, бандл, рендеринг, кэш. | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4/skills/react-best-practices) | MIT | ✅ 2026-10-15 · ⚠️ 1 |
| [verification-before-completion](skills/universal/verification-before-completion/SKILL.md) | Проверка перед словом «готово»: запустить тесты и показать вывод, а не утверждать. | [obra/superpowers](https://github.com/obra/superpowers/tree/bb92a7774141/skills/verification-before-completion) | MIT | ✅ 2026-10-15 |
| [web-design-guidelines](skills/universal/web-design-guidelines/SKILL.md) | Ревью интерфейса по Web Interface Guidelines: доступность, UX, формы, состояния. | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4/skills/web-design-guidelines) | MIT | ✅ 2026-10-15 |
| [writing-guidelines](skills/universal/writing-guidelines/SKILL.md) | Правила письменной речи для документации и интерфейсов: ясность, краткость, структура. | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4/skills/writing-guidelines) | MIT | ✅ 2026-10-15 |
| [writing-plans](skills/universal/writing-plans/SKILL.md) | План реализации по шагам с проверяемыми результатами — для себя или другого агента. | [obra/superpowers](https://github.com/obra/superpowers/tree/bb92a7774141/skills/writing-plans) | MIT | ✅ 2026-10-15 |
<!-- catalog:end -->

## Проверено TKBK: что именно проверяем

Аудиты открытых реестров скилов в 2026 году нашли сотни скилов, которые ставят вредоносный код, читают ключи и
отправляют их наружу. Поэтому каждый скил этого хаба — свой или импортированный — проходит `tools/audit.mjs`:
в CI на каждый PR и при каждой пересборке каталога. Аудит ничего не выполняет: он читает файлы и ищет паттерны.

| Проверка | Что ловим | В коде | В тексте |
|---|---|---|---|
| **Загрузка в оболочку** | `curl … \| sh`, `wget … \| bash`, `iwr … \| iex`, интерпретатор, который читает скачанный код | ошибка | ошибка |
| **Чужие ключи** | `~/.ssh`, приватные ключи, `.aws/credentials`, `.netrc`, `.gnupg`, `.npmrc`, `.kube/config`, учётные данные Claude Code, `/etc/passwd`, отправка `.env` | ошибка | ошибка |
| **Дамп окружения** | `printenv \| …`, `env > …`, сериализация всего `process.env` / `os.environ` | ошибка / предупр. | ошибка / предупр. |
| **Зашитые секреты** | ключи вида `cr_…`, `sk-…`, AWS, GitHub, Slack, токены Telegram-ботов, приватные ключи, `api_key = "…"` | ошибка | ошибка |
| **Обфускация** | base64-декодирование, `eval`, `new Function`, `exec("…")`, строки из кодов символов, длинные `\x..`, байтовые массивы | ошибка | предупреждение (гайд по безопасности вправе назвать `eval`) |
| **Невидимые символы** | zero-width и bidi-символы, которыми прячут инструкции | ошибка | ошибка |
| **Разрушительные команды** | `rm -rf` корня/дома, форматирование дисков, fork-бомбы, reverse shell, отключение антивируса, запуск агента без проверок прав; `sudo`, `chmod 777`, автозапуск | ошибка / предупр. | ошибка / предупр. |
| **Инъекции в агента** | «ignore previous instructions», «do not tell the user», «без ведома пользователя», jailbreak-фразы; отрицание («never … without user confirmation») — предупреждение | ошибка | ошибка |
| **Сетевые адреса** | каждый хост сверяется с [`tools/allowlist.json`](tools/allowlist.json): API TKBK и площадок, CRM, ЮKassa, Z.ai, документация; IP вместо домена — ошибка; `http://` — предупреждение; скрипт с сетью без единого хоста — предупреждение | ошибка | предупреждение (ссылка ничего не отправляет) |
| **Структура** | YAML-frontmatter (`name` = имя папки, `description`), только текстовые файлы и картинки/шрифты, без архивов, бинарников, симлинков и `.env`, файл ≤ 256 КБ | ошибка | ошибка |
| **Лицензия и источник** | у импортированного скила — `LICENSE` (или `NOTICE` со ссылкой на лицензию репозитория) и блок `tkbk:` в frontmatter: источник с коммитом, лицензия, дата импорта | — | — |

Что осталось в каталоге осознанно, лежит в [`tools/audit-accept.json`](tools/audit-accept.json) с причиной и
печатается в отчёте как `ACCEPTED` — ничего не прячется. Что аудит **не** гарантирует: что инструкция хороша и что
скрипт делает ровно то, что написано в описании. Поэтому свои скилы написаны и прочитаны людьми из TKBK,
импортированные — отобраны из официальных и широко используемых репозиториев, а любая запись во внешний сервис
по инструкции скила происходит только после подтверждения пользователем.

Запустить аудит самим, на любой папке со скилами:

```bash
node tools/audit.mjs                      # этот репозиторий
node tools/audit.mjs ~/.claude/skills     # всё, что установлено у вас
node tools/audit.mjs path/to/skill --json # один скил, JSON-отчёт
```

Выход `0` — чисто, `1` — есть ошибки; `--strict` считает ошибками и предупреждения.

## Импорт и свои скилы

- **Импорт**: источник, лицензия и русское описание — в [`tools/sources.json`](tools/sources.json).
  `node tools/import.mjs --from <папка с клонами репозиториев>` копирует скилы в `skills/<категория>/<имя>/`,
  сохраняет `LICENSE`, дописывает в frontmatter блок `tkbk:` (источник с коммитом, лицензия, дата). Тело скила не
  меняется. Копируем только MIT, Apache-2.0 и подобные; проприетарные (документные скилы Anthropic) — ссылкой.
- **Свой скил**: папка `skills/tkbk/<имя>/SKILL.md` (имя — строчные буквы, цифры, дефис), frontmatter `name` и
  `description` с фразами, по которым агент должен применять скил. Скрипты — в `scripts/`, шаблоны — в `templates/`.
  Любая запись во внешний сервис — только с подтверждением пользователя; ключи — только из переменных окружения.
- Новые хосты — в `tools/allowlist.json` с причиной. Потом `npm test` (тесты аудита, аудит каталога, актуальность
  каталога) и `node tools/build-catalog.mjs` — он перестраивает таблицы выше, `catalog.json` и `index.html`.

## Лицензия

Скилы TKBK и инструменты — MIT. Импортированные скилы сохраняют лицензии источников (в каждой папке — `LICENSE` или
`NOTICE`): Anthropic (Apache-2.0), OpenAI (Apache-2.0, vercel-deploy — MIT), DeepSeek (MIT), Z.ai (Apache-2.0),
Vercel (MIT), obra/superpowers (MIT), addyosmani/agent-skills (MIT). TKBK — независимый сервис, не связанный
с авторами этих репозиториев.

---

## English

**TKBK Skills Hub** — audited `SKILL.md` skills for AI agents: TKBK's own skills for the Russian market
(Wildberries reviews, Ozon questions, Yandex Market stock alerts, Bitrix24 leads, amoCRM follow-ups, Avito chats,
YooKassa/SBP payments, a technical specification from a chat, Russian contract and public offer templates,
connecting any tool to the TKBK gateway) plus imported official skills from Anthropic (Claude), OpenAI (Codex),
DeepSeek, Z.ai (GLM) and engineering-practice skills (Vercel, superpowers, Addy Osmani), each kept with its license
and pinned to the source commit.

Format: [agent skills](https://github.com/vercel-labs/skills) — `skills/<category>/<name>/SKILL.md` with YAML front
matter. Works in Claude Code, Cursor, Codex CLI, Cline, OpenCode and TKBK Agent (`.tkbk/skills`, `~/.tkbk/skills`).

```bash
npx skills add tkbk-online/skills --skill wb-reviews
npx skills add tkbk-online/skills --list
```

**Verified by TKBK.** Every skill passes `tools/audit.mjs` in CI on each PR: pipe-to-shell installers, reads of
SSH/cloud/agent credentials, environment dumps, hard-coded secrets, obfuscation (base64, eval, hidden characters),
destructive commands, prompt injection against the agent, and every network host checked against
`tools/allowlist.json` (an error in code, a warning in prose). Reviewed exceptions live in `tools/audit-accept.json`
with their reasons. Writes to external services happen only after the user confirms. Run it on your own skills:
`node tools/audit.mjs ~/.claude/skills`. The full catalog with sources, licenses and audit status: [catalog.json](catalog.json),
[index.html](index.html).

License: MIT for TKBK's skills and tools; imported skills keep their upstream licenses. [tkbk.online](https://tkbk.online)
