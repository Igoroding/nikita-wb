# 📊 WB Dashboard — Никита

Дашборд мониторинга продаж на Wildberries. Один магазин — все артикулы автоматически.

---

## 🏗️ Архитектура

```
Wildberries API
      ↓
   n8n (сбор данных, ежедневно в 08:00 UTC)
      ↓
Supabase PostgreSQL (хранение)
      ↓
GitHub Pages (дашборд)
      ↓
Polza.ai / Claude (AI-анализ по запросу)
```

---

## 🚀 Установка — пошагово

### Шаг 1 — Создать Supabase проект

1. Зайти на [supabase.com](https://supabase.com) → New Project
2. Дать имя (например `wb-nikita`), выбрать регион EU West
3. После создания открыть **Settings → API**
4. Скопировать:
   - **Project URL** → `https://XXXX.supabase.co`
   - **anon public** key (для дашборда)
   - **service_role** key (для n8n — держи в секрете!)

### Шаг 2 — Создать таблицы в Supabase

Открыть **SQL Editor** и выполнить:

```sql
-- Заказы, продажи, реклама по дням
CREATE TABLE wb_rnp (
  date         date NOT NULL,
  shop         text NOT NULL DEFAULT 'nikita',
  orders_count integer DEFAULT 0,
  orders_sum   numeric DEFAULT 0,
  sales_count  integer DEFAULT 0,
  sales_sum    numeric DEFAULT 0,
  ads_spend    numeric DEFAULT 0,
  PRIMARY KEY (date, shop)
);

-- Остатки товаров на складах
CREATE TABLE wb_stocks (
  shop     text NOT NULL DEFAULT 'nikita',
  date     date NOT NULL,
  article  text NOT NULL,
  quantity integer DEFAULT 0,
  PRIMARY KEY (shop, date, article)
);

-- План на месяц
CREATE TABLE wb_plan (
  month        text PRIMARY KEY,
  orders_plan  numeric DEFAULT 0,
  sales_plan   numeric DEFAULT 0,
  drr_plan     numeric DEFAULT 10,
  updated_at   timestamptz DEFAULT now()
);
ALTER TABLE wb_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON wb_plan FOR ALL USING (true) WITH CHECK (true);

-- Дневник действий
CREATE TABLE wb_journal (
  id         bigserial PRIMARY KEY,
  date       date NOT NULL,
  note       text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE wb_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON wb_journal FOR ALL USING (true) WITH CHECK (true);
```

### Шаг 3 — Вставить ключи в HTML файлы

В файлах `rnp.html` и `stocks.html` найти и заменить:

```javascript
// Было:
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Стало (пример):
const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const SUPABASE_KEY = 'eyJhbGci...твой_anon_key...';
```

### Шаг 4 — Загрузить на GitHub Pages

1. Создать новый репозиторий на [github.com](https://github.com) (публичный)
2. Загрузить файлы: `rnp.html`, `stocks.html`, `header.js`, `favicon.svg`
3. Открыть **Settings → Pages → Source: Deploy from branch → main → / (root)**
4. Дашборд будет доступен по адресу: `https://USERNAME.github.io/REPO-NAME/rnp.html`

### Шаг 5 — Настроить n8n workflow

В [wbtrenz.app.n8n.cloud](https://wbtrenz.app.n8n.cloud) создать новый workflow.

#### Workflow для РнП (запускать ежедневно в 08:00 UTC)

**Узлы:**
1. **Schedule Trigger** — Cron: `0 8 * * *`
2. **HTTP Request (Заказы):**
   - URL: `https://statistics-api.wildberries.ru/api/v1/supplier/orders?dateFrom=DATE_14_DAYS_AGO&flag=1`
   - Header: `Authorization: YOUR_WB_TOKEN`
3. **Wait** — 1 минута (rate limit)
4. **HTTP Request (Продажи):**
   - URL: `https://statistics-api.wildberries.ru/api/v1/supplier/sales?dateFrom=DATE_14_DAYS_AGO&flag=1`
5. **HTTP Request (Реклама):**
   - URL: `https://advert-api.wb.ru/adv/v1/upd?from=DATE_14_DAYS_AGO&to=TODAY`
   - Header: `Authorization: YOUR_WB_TOKEN`
6. **Code (агрегация):**
   ```javascript
   // Группировка по дням, фильтр отмен и возвратов
   // isCancel = true → пропустить
   // saleID начинается с 'R' → пропустить (возврат)
   // Использовать priceWithDisc для суммы
   ```
7. **HTTP Request (Upsert в Supabase):**
   - URL: `https://ТВОЙ_SUPABASE.supabase.co/rest/v1/wb_rnp?on_conflict=date,shop`
   - Method: POST
   - Headers: `apikey: SERVICE_ROLE_KEY`, `Authorization: Bearer SERVICE_ROLE_KEY`, `Prefer: resolution=merge-duplicates`
   - Body: массив объектов `{ date, shop: 'nikita', orders_count, orders_sum, sales_count, sales_sum, ads_spend }`

#### Workflow для Остатков (запускать ежедневно в 08:00 UTC)

1. **Schedule Trigger** — Cron: `0 8 * * *`
2. **HTTP Request (Остатки):**
   - URL: `https://statistics-api.wildberries.ru/api/v1/supplier/stocks?dateFrom=YESTERDAY`
   - Header: `Authorization: YOUR_WB_TOKEN`
3. **Code (подготовка):**
   ```javascript
   // Для каждого товара создать запись { shop: 'nikita', date: TODAY, article: nmId, quantity: quantity }
   ```
4. **HTTP Request (Upsert в Supabase):**
   - URL: `https://ТВОЙ_SUPABASE.supabase.co/rest/v1/wb_stocks?on_conflict=shop,date,article`
   - Аналогично РнП

#### Токен Wildberries
Токен WB передаётся в заголовке `Authorization: <токен>` (без Bearer).

---

## 🔑 Ключи и токены

| Что | Где хранится |
|-----|-------------|
| WB API токен | В узлах n8n (Credentials или Header) |
| Supabase anon key | В `rnp.html` и `stocks.html` |
| Supabase service_role | Только в n8n, никуда не публиковать |
| Polza.ai ключ | В n8n AI webhook узле |

---

## 📁 Файлы

| Файл | Назначение |
|------|-----------|
| `rnp.html` | Дашборд РнП (заказы, продажи, реклама, ДРР) |
| `stocks.html` | Дашборд остатков — все артикулы магазина |
| `header.js` | Общая шапка и навигация |
| `favicon.svg` | Иконка сайта |

---

## 🤖 AI-анализ

AI-анализ работает через существующий webhook:
```
POST https://wbtrenz.app.n8n.cloud/webhook/wb-ai-v7
```

Это **общий** webhook — он уже настроен и работает. Ничего дополнительно настраивать не нужно.

---

## 🔧 Типичные проблемы

| Проблема | Решение |
|----------|---------|
| Данные не обновляются | Проверить Executions в n8n |
| AI не отвечает | Открыть последний Execution, найти упавший узел |
| План не сохраняется | Проверить RLS политику на `wb_plan` |
| Дашборд не загружается | Проверить `SUPABASE_URL` и `SUPABASE_KEY` в HTML файлах |

---

## 💬 Shop ID

Все данные в Supabase хранятся с `shop = 'nikita'`. Если нужно изменить — найти и заменить в HTML файлах:
```javascript
const SHOP = 'nikita';
```

---

*Создано на базе WB Dashboard (Одинг + Стольников)*
