# IZO Coach

**Тренажёр менеджера ИЗОСТУДИИ** — PWA-приложение для тренировки менеджеров по продажам и проектному сопровождению в рекламно-производственной компании.

Менеджер выбирает сценарий, общается с ИИ-клиентом (Groq API), проходит зачёты, получает оценку, историю попыток и рекомендации.

## Стек

| Часть | Технологии |
|-------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, PWA, lucide-react |
| Backend | FastAPI, Python 3.12, SQLite, SQLAlchemy, Pydantic |
| AI | Groq API (`llama-3.3-70b-versatile`) |

## Быстрый старт

### 1. Backend

```bash
cd backend
py -3.12 -m venv .venv   # Python 3.12 required (3.14 not yet supported)

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Укажите GROQ_API_KEY в .env
uvicorn app.main:app --reload --port 8000
```

При первом запуске автоматически:
- создаётся SQLite-база `izo_coach.db`;
- заполняются 14 seed-сценариев;
- создаётся dev-администратор (`telegram_id: dev_admin`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173

### Демо по IP (показать руководству в офисе)

Компьютер и телефоны должны быть в **одной Wi-Fi сети**.

**Вариант 1 — один клик:**

```powershell
.\start-demo.bat
```

Скрипт покажет адрес вида `http://192.168.1.5:5173` — откройте его с любого устройства в сети.

**Вариант 2 — вручную (два терминала):**

```powershell
# Терминал 1 — backend
cd backend
.venv\Scripts\uvicorn app.main:app --port 8000

# Терминал 2 — frontend (слушает все интерфейсы)
cd frontend
npm run dev
```

Vite выведет строку **Network:** `http://192.168.x.x:5173` — это и есть ссылка для коллег.

**Если не открывается** — разрешите входящие подключения в брандмауэре Windows:

```powershell
New-NetFirewallRule -DisplayName "IZO Coach Frontend" -Direction Inbound -Port 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "IZO Coach Backend" -Direction Inbound -Port 8000 -Protocol TCP -Action Allow
```

> Backend снаружи не нужен — API проксируется через frontend (`/api` → `localhost:8000`).

### 3. Вход (dev-режим)

На экране входа укажите имя и роль:
- **manager** — обычный менеджер
- **mentor** — наставник
- **admin** — администратор (доступ к админ-панели)

Для входа как админ выберите роль «Администратор» или войдите с именем, привязанным к `dev_admin`.

## GROQ_API_KEY

1. Получите ключ на https://console.groq.com/
2. Добавьте в `backend/.env`:

```
GROQ_API_KEY=ваш_ключ
GROQ_MODEL=llama-3.3-70b-versatile
```

Ключ хранится **только на backend**. Frontend обращается к ИИ через REST API.

## Сборка PWA

```bash
cd frontend
npm run build
npm run preview
```

PWA поддерживает:
- `manifest.json` (через vite-plugin-pwa)
- Service Worker с кэшированием статики
- Offline fallback на `index.html`
- Иконки 192×192 и 512×512

Для production разместите `dist/` на HTTPS-хостинге.

## Структура проекта

```
coach/
├── backend/
│   ├── app/
│   │   ├── api/          # REST endpoints
│   │   ├── db/           # SQLAlchemy models, seed
│   │   ├── prompts/      # AI prompts
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Groq integration
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
└── README.md
```

## API

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/dev-login` | Dev-авторизация |
| GET | `/api/me` | Профиль (заголовок `X-User-Id`) |
| GET | `/api/scenarios` | Список сценариев |
| POST | `/api/training/start` | Начать тренировку |
| POST | `/api/training/{id}/message` | Сообщение в чат |
| POST | `/api/training/{id}/finish` | Завершить и оценить |
| POST | `/api/exam/start` | Начать зачёт (5 кейсов) |
| GET | `/api/history` | История |
| GET | `/api/admin/users` | Пользователи (admin) |
| GET | `/api/admin/results/export.csv` | Выгрузка CSV (admin) |

## Разделы приложения

1. **Главная** — статистика, быстрый старт
2. **Тренировка** — сценарии с фильтрами и чатом
3. **Зачёт** — 5 случайных кейсов, сдан при среднем балле ≥ 7
4. **История** — все попытки с деталями
5. **Профиль** — статистика менеджера
6. **Админ-панель** — пользователи, сценарии, результаты

## Telegram Mini App (будущее)

Авторизация через `X-User-Id` подготовлена для замены на Telegram `initData` validation. Dev-login отключается через `DEV_MODE=false` в `.env`.

## Лицензия

Внутренний проект ИЗОСТУДИИ.
