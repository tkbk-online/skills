---
name: yookassa-sbp
description: Интеграция приёма оплаты ЮKassa и СБП в код — создание платежа (POST /v3/payments, payment_method_data sbp, Idempotence-Key), страница оплаты, вебхук payment.succeeded с проверкой IP и статуса, чек 54-ФЗ, возвраты, тестовый магазин; скрипт scripts/yookassa-sbp.mjs для проверки. Применяй, когда просят «подключить ЮKassa», «оплату по СБП», «принять платёж в приложении / боте / на сайте», «вебхук оплаты».
license: MIT
metadata:
  author: TKBK
  version: "1.0"
  verified: "2026-10-15"
  requires: магазин ЮKassa (YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY)
  tags: юkassa, сбп, оплата, платежи, 54-фз, вебхук
---

# Оплата ЮKassa и СБП в коде

Скил ведёт разработчика по интеграции ЮKassa от тестового магазина до боевого вебхука. Логика одна для сайта,
Telegram-бота и мобильного приложения: **создать платёж на сервере → отправить пользователя на оплату → узнать результат
по вебхуку → проверить его → выдать товар**.

## Когда применять

- «Подключи ЮKassa / СБП», «добавь оплату картой и по СБП», «сделай кнопку оплаты в боте».
- «Напиши обработчик вебхука ЮKassa», «почему платёж висит в pending», «сделай возврат».

## Что нужно

| Что | Откуда |
|---|---|
| `YOOKASSA_SHOP_ID` | Кабинет ЮKassa → Интеграция → Ключи API → **shopId** |
| `YOOKASSA_SECRET_KEY` | там же, секретный ключ. Для разработки — **тестовый магазин** (ключ начинается с `test_`) |
| HTTPS-адрес для вебхука | порт 443 или 8443; локально — туннель |

Ключи кладём в переменные окружения / секреты сервера. В код, репозиторий, логи и чат — никогда.
Секретный ключ даёт право создавать возвраты, то есть выводить деньги: утечка = прямые убытки.

## Факты API, которые надо знать

- База: `https://api.yookassa.ru/v3/`. Аутентификация: HTTP Basic `shopId:secretKey`.
- Каждый `POST` — с заголовком `Idempotence-Key` (UUID v4, свой на каждую попытку одного и того же действия).
  Повтор с тем же ключом вернёт тот же результат, а не второй платёж.
- Сумма — строка с двумя знаками: `"100.00"`, валюта `RUB`. `description` — до 128 символов, видна покупателю.
- `capture: true` — одностадийный платёж (деньги списываются сразу). СБП двухстадийный не поддерживает.
- Способ оплаты: `payment_method_data: {"type": "sbp"}` — только СБП; без `payment_method_data` — покупатель выберет
  сам на странице ЮKassa (карта, СБП, SberPay …, по настройкам магазина).
- Подтверждение: `confirmation: {"type": "redirect", "return_url": "…"}` → в ответе `confirmation.confirmation_url` —
  страница ЮKassa (на десктопе QR для СБП, на телефоне — список банков). Для своей формы есть `embedded`
  (виджет) и мобильные SDK.
- `metadata` — до 16 пар ключ-значение: положи `order_id`, `user_id`, они вернутся в вебхуке.
- Статусы: `pending` → (`waiting_for_capture`) → `succeeded` или `canceled`. СБП-платёж живёт 1 час. Лимит
  СБП: 1 ₽ – 700 000 ₽.
- Вебхук: `POST` на ваш URL с телом `{"type": "notification", "event": "payment.succeeded", "object": {…платёж…}}`.
  События включаются в кабинете (Интеграция → HTTP-уведомления): `payment.succeeded`, `payment.canceled`,
  `payment.waiting_for_capture`, `refund.succeeded`. Ответить надо `HTTP 200`, иначе ЮKassa повторяет 24 часа.
- Возврат: `POST /v3/refunds` с `{"payment_id": "…", "amount": {"value": "…", "currency": "RUB"}}`, тоже с
  `Idempotence-Key`. СБП возвращает полностью и частично.
- Чек по 54-ФЗ (если магазин использует облачную кассу через ЮKassa): в платёж добавляется `receipt` с
  `customer` (`email` или `phone`) и `items` (`description`, `quantity`, `amount`, `vat_code`, `payment_subject`,
  `payment_mode`). Без него платёж с включённой фискализацией отклоняется.

## Порядок интеграции

1. **Тестовый магазин.** Получи у пользователя тестовые shopId и ключ (или попроси создать тестовый магазин в
   кабинете). Проверь связь: `node scripts/yookassa-sbp.mjs create 10 "Тест" --return-url https://example.com/ok`.
2. **Создание платежа на сервере.** Эндпоинт `POST /api/pay` в приложении пользователя: принимает `order_id`,
   считает сумму **на сервере** (не доверяй сумме из клиента), создаёт платёж, сохраняет `payment.id` рядом с заказом
   со статусом `pending`, отдаёт клиенту `confirmation_url`.
3. **Отправка на оплату.** Сайт — редирект или кнопка; Telegram-бот — inline-кнопка с `confirmation_url`;
   приложение — открыть ссылку (или SDK).
4. **Вебхук.** Эндпоинт `POST /api/yookassa/webhook`:
   - принять JSON, ответить `200` быстро (обработку — после ответа или в очереди);
   - проверить IP отправителя по списку ЮKassa (`185.71.76.0/27`, `185.71.77.0/27`, `77.75.153.0/25`,
     `77.75.156.11`, `77.75.156.35`, `77.75.154.128/25`, `2a02:5180::/32`) — за прокси брать `X-Forwarded-For`
     только если прокси ваш;
   - **не верить телу**: взять `object.id` и запросить `GET /v3/payments/{id}` — статус из этого ответа и есть
     истина;
   - сверить `amount.value` и `metadata.order_id` с заказом в базе;
   - идемпотентно: если заказ уже `paid` — ничего не делать;
   - только теперь выдать товар / зачислить баланс / отправить сообщение в бот.
5. **Запасной путь.** Страница `return_url` не означает оплату: на ней показывай статус из своей базы, а если
   вебхук ещё не пришёл — запроси `GET /v3/payments/{id}` сам (или `node scripts/yookassa-sbp.mjs wait <id>`).
6. **Возвраты и отмены.** Отдельный серверный эндпоинт для админа; `refund.succeeded` в вебхуке → пометить заказ.
7. **Боевой режим.** Заменить ключи на боевые, включить события в кабинете на боевой URL, провести платёж на
   минимальную сумму и возврат, проверить чек (если есть касса).

## Пример: создание платежа (Node, без SDK)

```js
import { randomUUID } from "node:crypto";

export async function createPayment({ amountRub, description, orderId, returnUrl, sbpOnly = false }) {
  const auth = Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString("base64");
  const body = {
    amount: { value: amountRub.toFixed(2), currency: "RUB" },
    capture: true,
    description: description.slice(0, 128),
    confirmation: { type: "redirect", return_url: returnUrl },
    metadata: { order_id: String(orderId) },
    ...(sbpOnly ? { payment_method_data: { type: "sbp" } } : {}),
  };
  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Idempotence-Key": randomUUID(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`YooKassa ${res.status}: ${await res.text()}`);
  const p = await res.json(); // { id, status: "pending", confirmation: { confirmation_url } }
  return { paymentId: p.id, url: p.confirmation.confirmation_url };
}
```

(`toString("base64")` здесь — стандартная кодировка HTTP Basic, не обфускация.)

## Пример: вебхук (Express)

```js
app.post("/api/yookassa/webhook", express.json(), async (req, res) => {
  res.sendStatus(200); // confirm receipt first; YooKassa retries for 24 h otherwise
  const { event, object } = req.body ?? {};
  if (!event?.startsWith("payment.") || !object?.id) return;
  const payment = await getPayment(object.id); // GET /v3/payments/{id} with the same Basic auth
  const order = await db.orders.findByPaymentId(payment.id);
  if (!order || order.status === "paid") return;
  if (payment.status === "succeeded" && payment.amount.value === order.amount && payment.metadata?.order_id === order.id) {
    await db.orders.markPaid(order.id, payment);
    await fulfil(order);
  } else if (payment.status === "canceled") {
    await db.orders.markCanceled(order.id, payment.cancellation_details?.reason);
  }
});
```

Python: пакет `yookassa` (`Configuration.account_id`, `Configuration.secret_key`, `Payment.create(body, idempotence_key)`),
логика та же.

## Скрипт для проверки

```bash
node scripts/yookassa-sbp.mjs create 10 "Заказ 1" --return-url https://example.com/ok [--sbp]
node scripts/yookassa-sbp.mjs get <payment_id>
node scripts/yookassa-sbp.mjs wait <payment_id>          # опрашивает до succeeded/canceled, до 10 минут
node scripts/yookassa-sbp.mjs refund <payment_id> 10
```

## Типичные ошибки

| Симптом | Причина | Решение |
|---|---|---|
| `401` | неверный shopId/ключ или ключ другого магазина (тест/бой) | проверить пару ключей |
| `400 invalid_request` «receipt» | у магазина включена касса, а чека нет | добавить `receipt` |
| платёж `canceled`, `cancellation_details.reason: payment_expired` | покупатель не оплатил за час (СБП) | создать новый платёж |
| вебхук не приходит | не включены события, не HTTPS, не 443/8443, ответ не 200 | проверить настройки и логи |
| товар выдан дважды | обработчик не идемпотентен | проверять статус заказа до выдачи |
| товар выдан без денег | поверили телу вебхука | всегда `GET /v3/payments/{id}` |

## Ссылки

- Справочник API: https://yookassa.ru/developers/api
- СБП: https://yookassa.ru/developers/payment-acceptance/integration-scenarios/manual-integration/other/sbp
- Вебхуки: https://yookassa.ru/developers/using-api/webhooks
- Банки СБП: https://sbp.nspk.ru/participants/
