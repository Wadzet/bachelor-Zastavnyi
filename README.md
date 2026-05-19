# BizInsight Platform

**Тема кваліфікаційної роботи бакалавра:**  
**«Розроблення інтелектуальної веб-платформи для автоматизованого створення медіаконтенту про впровадження рішень штучного інтелекту в бізнесі»**

**Автор:** Заставний Василь-Вадим Валерійович 

**Науковий керівник:** Костюченко Юрій Юрійович, CBDO UBOS

---

## Про проєкт

**BizInsight Platform** — це інтелектуальна веб-платформа для створення, редакційної перевірки та поширення медіаконтенту про впровадження AI-рішень у бізнесі.

Платформа допомагає скоротити ручну роботу під час підготовки матеріалів: система може працювати з перевіреними джерелами або введеним текстом, створювати AI-чернетки, генерувати зображення для матеріалів, зберігати результат у CMS і поширювати готові публікації на вебсайті, а також у Telegram та LinkedIn.

Проєкт має два основні сценарії роботи:

- **автоматизований режим** — система працює з визначеними джерелами та параметрами й готує матеріал до публікації;
- **редакторський режим** — редактор сам обирає джерело, тип контенту, тему, AI-модель, перевіряє чернетку та приймає фінальне рішення щодо публікації.

---



## Стек технологій

| Частина системи | Технології |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend / BaaS | Supabase PostgreSQL, Supabase Auth, Supabase Storage, RLS |
| AI text generation | Gemini API, OpenAI API |
| AI image generation | Replicate FLUX.1 Schnell, Gemini 2.5 Flash Image, SVG fallback |
| Integrations | Telegram Bot API, LinkedIn API, OAuth |
| Hosting | Vercel |

---


## Запуск проекту:

### 1. Клонувати репозиторій

```bash
git clone <repository-url>
cd <bachelor-Zastavnyi>
```

### 2. Встановити залежності

```bash
npm install
```

### 3. Створити локальний файл змінних середовища

```bash
cp .env.example .env.local
```

Після цього потрібно відкрити `.env.local` і заповнити значення змінних.

### 4. Запустити проєкт локально

```bash
npm run dev
```

Після запуску сайт буде доступний за адресою:

```txt
http://localhost:3000
```

Адміністративна частина:

```txt
http://localhost:3000/admin
```

---

## Змінні середовища

Усі потрібні змінні мають бути описані у файлі `.env.example`. Для локального запуску потрібно створити `.env.local` і заповнити значення.

Приклад основних змінних:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ADMIN_EMAILS=
NEXT_PUBLIC_SITE_URL=

GEMINI_API_KEY=
OPENAI_API_KEY=
REPLICATE_API_TOKEN=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=
LINKEDIN_API_VERSION=

DEFAULT_IMAGE_PROVIDER=
```


---

## Налаштування Supabase

1. Створити новий проєкт у [Supabase](https://supabase.com).
2. Скопіювати `Project URL` і `anon public key` у `.env.local`.
3. Скопіювати `service_role key` у `.env.local`.
4. Відкрити **Supabase Dashboard → SQL Editor**.
5. Послідовно виконати SQL-міграції з папки:

```txt
supabase/migrations
```

Міграції потрібно виконувати за порядком нумерації.

### Supabase Storage

Для зображень матеріалів використовується bucket:

```txt
post-images
```

Його потрібно створити вручну:

1. Відкрити **Supabase Dashboard → Storage**.
2. Натиснути **New bucket**.
3. Назва bucket: `post-images`.
4. Увімкнути public access, якщо зображення мають відкриватися на публічному сайті.
5. Дозволені MIME types:

```txt
image/png, image/jpeg, image/webp
```

---

## Налаштування адміністратора

Admin CMS доступна тільки для дозволених користувачів.

1. Створити користувача в **Supabase Authentication**.
2. Додати email цього користувача у змінну:

```env
ADMIN_EMAILS=
```

Якщо адміністраторів кілька, email-адреси можна розділити комами.

---

## Налаштування AI-провайдерів

### Gemini / OpenAI

Gemini API та OpenAI API використовуються для генерації текстових чернеток. Для роботи потрібно додати відповідні API-ключі в `.env.local`.

```env
GEMINI_API_KEY=
OPENAI_API_KEY=
```

### Replicate

Replicate використовується для генерації зображень, зокрема через модель FLUX.1 Schnell.

```env
REPLICATE_API_TOKEN=
```

Якщо зовнішній провайдер недоступний або токен не налаштовано, система може використовувати SVG fallback.

---

## Налаштування Telegram

1. Створити Telegram-бота через [@BotFather](https://t.me/BotFather).
2. Отримати bot token.
3. Додати бота в потрібний канал або групу.
4. Отримати `chat_id` каналу або групи.
5. Додати значення в `.env.local`:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Після цього матеріали можна надсилати в Telegram через admin/CMS.

---

## Налаштування LinkedIn

1. Створити LinkedIn Developer App.
2. Налаштувати OAuth redirect URL.
3. Додати Client ID і Client Secret у `.env.local`:

```env
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=
LINKEDIN_API_VERSION=
```

4. Запустити проєкт.
5. Перейти в admin/CMS.
6. Натиснути **Connect LinkedIn**.
7. Після успішного OAuth-підключення можна публікувати матеріали в LinkedIn.

Для production-деплою redirect URL має відповідати домену Vercel, наприклад:

```txt
https://your-project.vercel.app/api/admin/linkedin/callback
```

---

## Доступні npm-скрипти

```bash
npm run dev
```

Запуск dev-сервера.

```bash
npm run build
```

Production-збірка.

```bash
npm run start
```

Запуск production-збірки.

```bash
npm run lint
```

Перевірка коду лінтером.


## Деплой на Vercel

1. Запушити репозиторій у GitHub.
2. Відкрити [Vercel](https://vercel.com).
3. Натиснути **Add New Project**.
4. Обрати GitHub-репозиторій.
5. Додати всі environment variables з `.env.example`.
6. Запустити deployment.
7. Після деплою оновити:

```env
NEXT_PUBLIC_SITE_URL=
LINKEDIN_REDIRECT_URI=
```

8. Перевірити публічний сайт і admin/CMS.

---

## Перевірка роботи

Для перевірки роботи платформи можна пройти такий сценарій:

1. Відкрити публічний сайт.
2. Перейти в admin/CMS.
3. Авторизуватися як адміністратор.
4. Перевірити або додати trusted source.
5. Створити AI-чернетку з URL або raw text.
6. Переглянути й відредагувати чернетку.
7. Створити публікацію.
8. Згенерувати зображення для матеріалу.
9. Опублікувати матеріал на сайті.
10. Надіслати матеріал у Telegram.
11. Опублікувати матеріал у LinkedIn.
12. Перевірити статуси дистрибуції в admin/CMS.

---

## Статус проєкту

Проєкт розроблено як робочий MVP у межах бакалаврської кваліфікаційної роботи. Поточна версія демонструє повний цикл роботи з контентом: від джерела або raw text до AI-чернетки, редакційної перевірки, публікації на сайті та поширення в Telegram і LinkedIn.

---

## Ліцензія

Проєкт створено в навчальних цілях у межах кваліфікаційної роботи бакалавра за спеціальністю 122 «Комп’ютерні науки».
