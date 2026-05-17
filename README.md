# BizInsight Platform

> **Тема бакалаврської кваліфікаційної роботи:**
> Розроблення інтелектуальної веб-платформи для автоматизованого створення медіаконтенту про впровадження рішень штучного інтелекту в бізнесі

---

## Автор

| Поле | Значення |
|---|---|
| ПІБ | Заставний Василь-Вадим Валерійович |
| Група | 4CS-41 |
| Спеціальність | 122 Комп'ютерні науки |

## Науковий керівник

| Поле | Значення |
|---|---|
| ПІБ | Костюченко Юрій Юрійович |
| Посада | CBDO у UBOS |

---

## Опис проєкту

**BizInsight Platform** — це інтелектуальна веб-платформа, що автоматизує повний цикл створення, редакційного огляду та багатоканального поширення медіаконтенту про впровадження рішень штучного інтелекту в бізнесі.

**Яку проблему вирішує:**
Редакції та контент-команди витрачають багато часу на ручне написання матеріалів, пошук тем і дистрибуцію публікацій. BizInsight автоматизує ці процеси: система аналізує першоджерела, генерує чернетки за допомогою AI, дозволяє редактору їх перевірити й одним кліком опублікувати на сайті та поширити в Telegram і LinkedIn.

**Для кого:**
Контент-команди, медіа-видання, PR-відділи та бізнеси, які публікують матеріали про AI-трансформацію.

**AI-функції:**
- Генерація чернеток статей та інтерв'ю на основі URL-посилання або текстового введення (Google Gemini / OpenAI)
- Генерація обкладинок для публікацій (Replicate FLUX.1 Schnell, Gemini Image Generation, SVG-fallback)
- Інтелектуальний вибір формату та візуального стилю обкладинки залежно від типу контенту

**Канали дистрибуції:**
- Публікація на публічному сайті (Next.js SSR/SSG)
- Поширення в Telegram-канал через Telegram Bot API (фото + підпис або текст)
- Публікація в LinkedIn через LinkedIn OAuth 2.0 та LinkedIn API (з прикріпленим зображенням або текстом)

---

## Основні можливості

- **Публічний сайт** — стрічка та детальні сторінки матеріалів (Insights, Interviews) з OG-метаданими та зображеннями обкладинок
- **Захищений адмін-розділ (CMS)** — доступний лише авторизованим адміністраторам через Supabase Auth
- **Управління першоджерелами** — додавання, редагування та видалення URL-джерел для генерації контенту
- **AI-генерація чернеток** — автоматичне створення структурованих чернеток з URL або сирого тексту
- **Редакційний workflow** — перегляд, редагування та затвердження чернеток перед публікацією
- **Ручний та автоматичний режими** — редактор може вносити зміни або повністю покластися на AI
- **AI-генерація обкладинок** — вибір провайдера (Replicate / Gemini / SVG) та автоматичне збереження в Supabase Storage
- **Supabase PostgreSQL** — надійна реляційна БД з RLS-захистом
- **Telegram Bot API** — публікація матеріалу з фото-обкладинкою або як текстового повідомлення
- **LinkedIn OAuth 2.0 + LinkedIn API** — публікація з прикріпленим зображенням або текст-only пост
- **Статуси дистрибуції** — відстеження стану відправки в Telegram та LinkedIn для кожної публікації
- **Деплой на Vercel** — автоматичний CI/CD із GitHub

---

## Технічний стек

| Категорія | Технології |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| **Backend / BaaS** | Supabase PostgreSQL, Supabase Auth, Supabase Storage, RLS |
| **AI** | Google Gemini API (`@google/genai`), OpenAI API, Replicate FLUX.1 Schnell |
| **Інтеграції** | Telegram Bot API, LinkedIn REST API, LinkedIn OAuth 2.0 |
| **Деплой** | Vercel |
| **Контроль версій** | Git, GitHub |

---

## Структура проєкту

```
src/
├── app/
│   ├── (public)/          # Публічний сайт: головна, insights, interviews, контакти
│   ├── admin/             # Захищений адмін-розділ: дашборд, джерела, чернетки, публікації
│   └── api/               # API Route Handlers: AI-генерація, Telegram, LinkedIn, auth
├── components/
│   ├── admin/             # Компоненти CMS (форми, таблиці, панелі попереднього перегляду)
│   ├── brand/             # Логотип та брендові компоненти
│   ├── content/           # Компоненти відображення статей та інтерв'ю
│   ├── home/              # Компоненти головної сторінки
│   ├── layout/            # Хедер, футер, навігація
│   └── ui/                # Загальні UI-примітиви
├── lib/
│   ├── supabase/          # Supabase-клієнти (server-only та browser)
│   ├── data/              # Функції доступу до даних (server-only)
│   ├── gemini/            # Gemini AI: генерація тексту та зображень
│   ├── image/             # Абстракція провайдерів генерації зображень
│   ├── telegram/          # Telegram Bot API клієнт
│   ├── linkedin/          # LinkedIn OAuth та LinkedIn API клієнт
│   └── auth/              # Логіка авторизації та middleware
supabase/
└── migrations/            # SQL-міграції схеми бази даних (001–004)
public/                    # Статичні ресурси: логотип, favicon
```

---

## Налаштування та локальний запуск

### Передумови

- Node.js 20 або новіший
- npm 10 або новіший
- Обліковий запис [Supabase](https://supabase.com) з новим проєктом

### 1. Клонування репозиторію

```bash
git clone <repository-url>
cd ai-business-media-platform
```

### 2. Встановлення залежностей

```bash
npm install
```

### 3. Налаштування змінних середовища

```bash
cp .env.example .env.local
```

Відкрийте `.env.local` і заповніть значення (детальні інструкції для кожної змінної наведено у `.env.example`):

| Змінна | Опис | Обов'язкова |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase-проєкту | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon (публічний) ключ Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role ключ (тільки сервер!) | ✅ |
| `GEMINI_API_KEY` | API-ключ Google Gemini | ✅ |
| `ADMIN_EMAILS` | Email-адреси адміністраторів (через кому) | ✅ |
| `NEXT_PUBLIC_SITE_URL` | Публічний URL сайту | ✅ |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота від @BotFather | Telegram |
| `TELEGRAM_CHAT_ID` | ID Telegram-каналу або групи | Telegram |
| `LINKEDIN_CLIENT_ID` | Client ID LinkedIn Developer App | LinkedIn |
| `LINKEDIN_CLIENT_SECRET` | Client Secret LinkedIn Developer App | LinkedIn |
| `LINKEDIN_REDIRECT_URI` | Callback URL для LinkedIn OAuth | LinkedIn |
| `LINKEDIN_API_VERSION` | Версія LinkedIn API (формат YYYYMM) | LinkedIn |
| `REPLICATE_API_TOKEN` | API-токен Replicate (для FLUX.1 Schnell) | Зображення |
| `DEFAULT_IMAGE_PROVIDER` | Провайдер зображень: `auto`/`replicate`/`gemini`/`svg` | — |

> **Безпека:** `.env.local` є git-ignored і **ніколи не повинен потрапляти в репозиторій**. Ключі `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `REPLICATE_API_TOKEN`, `TELEGRAM_BOT_TOKEN`, `LINKEDIN_CLIENT_SECRET` використовуються виключно на сервері.

### 4. Налаштування бази даних

Міграції застосовуються через [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**. Виконайте файли по черзі у порядку нумерації:

```
supabase/migrations/001_initial_schema.sql   — схема таблиць та enum-типів
supabase/migrations/002_enable_rls.sql        — увімкнення Row Level Security
supabase/migrations/003_linkedin_oauth.sql    — таблиця для LinkedIn OAuth-токенів
supabase/migrations/004_post_images_bucket.sql — (тільки документація, без SQL)
```

> **Supabase Storage (обкладинки):** Bucket `post-images` потрібно створити вручну через Dashboard → **Storage → New bucket**:
> - Name: `post-images`
> - Public: **увімкнено**
> - Allowed MIME types: `image/png, image/jpeg, image/webp`
> - Max file size: `5 MB`

### 5. Налаштування адміністраторів

У [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication → Users** створіть обліковий запис для адміністратора. Email цього запису має бути вказано у змінній `ADMIN_EMAILS` у `.env.local`.

### 6. Запуск у режимі розробки

```bash
npm run dev
```

Сайт доступний за адресою: [http://localhost:3000](http://localhost:3000)
Адмін-панель: [http://localhost:3000/admin](http://localhost:3000/admin)

### Доступні скрипти

| Скрипт | Команда | Опис |
|---|---|---|
| Розробка | `npm run dev` | Запуск dev-сервера на `0.0.0.0:3000` |
| Збірка | `npm run build` | Production-збірка Next.js |
| Запуск | `npm run start` | Запуск production-збірки |
| Лінтер | `npm run lint` | Перевірка коду ESLint |

---

## Деплой на Vercel

1. Зробіть fork або push репозиторію на GitHub.
2. Підключіть репозиторій у [Vercel Dashboard](https://vercel.com/new).
3. У **Settings → Environment Variables** додайте всі змінні з `.env.example` (з реальними значеннями).
4. Оновіть `NEXT_PUBLIC_SITE_URL` та `LINKEDIN_REDIRECT_URI` на продакшн-домен Vercel.
5. Vercel автоматично збирає та деплоїть проєкт при кожному push у `main`.

---

## Ліцензія

Проєкт розроблено виключно в навчальних цілях у рамках бакалаврської кваліфікаційної роботи.
