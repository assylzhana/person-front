# Person Productivity System — Frontend

Клиентская часть системы управления личной продуктивностью. Реализует интерфейс для работы с целями, финансами, психологическими тестами, аналитикой, друзьями и уведомлениями.

Backend работает на `http://localhost:8080`. Все запросы идут через единственный Axios-инстанс с автоматическим обновлением JWT-токена.

---

## Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Технологический стек](#технологический-стек)
3. [Структура проекта](#структура-проекта)
4. [Архитектура приложения](#архитектура-приложения)
5. [Аутентификация и токены](#аутентификация-и-токены)
6. [API — полный справочник](#api--полный-справочник)
   - [Auth](#auth)
   - [Users / Profile](#users--profile)
   - [Friends](#friends)
   - [Goals](#goals)
   - [Finance](#finance)
   - [Tests](#tests)
   - [Analytics](#analytics)
   - [Notifications](#notifications)
7. [Стейт-менеджмент](#стейт-менеджмент)
8. [Роутинг](#роутинг)
9. [Локализация](#локализация)
10. [UI-компоненты](#ui-компоненты)
11. [Стили и дизайн-система](#стили-и-дизайн-система)

---

## Быстрый старт

```bash
# Установить зависимости
npm install

# Запустить в режиме разработки (http://localhost:5173)
npm run dev

# Собрать для продакшена
npm run build

# Предпросмотр сборки
npm run preview
```

Убедитесь, что backend запущен на `http://localhost:8080` перед запуском фронта.

---

## Технологический стек

| Категория | Библиотека | Версия | Назначение |
|-----------|-----------|--------|-----------|
| **Фреймворк** | React | 18.3 | UI-рендеринг |
| **Сборщик** | Vite | 5.4 | Dev-сервер, бандлинг |
| **Язык** | TypeScript | 5.6 | Статическая типизация |
| **Роутинг** | React Router DOM | 7 | SPA-навигация, защищённые маршруты |
| **Серверный стейт** | TanStack Query (React Query) | 5 | Кэш запросов, мутации, invalidation |
| **HTTP-клиент** | Axios | 1.15 | Запросы к API, интерцепторы JWT |
| **Клиентский стейт** | Zustand | 5 | Глобальный стейт (auth) |
| **Формы** | React Hook Form | 7 | Управление формами без ре-рендеров |
| **Валидация** | Zod | 4 | Схемы валидации форм |
| **Стили** | Tailwind CSS | 3.4 | Utility-first CSS |
| **Иконки** | Lucide React | 1.11 | SVG-иконки |
| **Графики** | Recharts | 3.8 | RadarChart, BarChart, PieChart |
| **Локализация** | i18next + react-i18next | 26 / 17 | RU / EN / KK |
| **Утилиты классов** | clsx + tailwind-merge | 2 / 3 | Условные CSS-классы |
| **Шрифт** | Inter (Google Fonts) | — | Основной шрифт |

---

## Структура проекта

```
src/
├── api/                    # Слой запросов к бэкенду
│   ├── client.ts           # Axios-инстанс, JWT-интерцепторы, авторефреш
│   ├── auth.ts             # /auth/*
│   ├── users.ts            # /users/*, /users/friends/*, /users/tests/*
│   ├── goals.ts            # /goals/*
│   ├── finance.ts          # /finance/*
│   ├── analytics.ts        # /analytics/*
│   └── notifications.ts    # /notifications/*
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx   # Обёртка авторизованных страниц (sidebar + header)
│   │   ├── AuthLayout.tsx  # Обёртка страниц входа/регистрации
│   │   ├── Sidebar.tsx     # Боковое меню с навигацией и бейджами
│   │   └── PageHeader.tsx  # Заголовок страницы с action-кнопкой
│   └── ui/
│       ├── Modal.tsx        # Модальное окно (bottom-sheet на мобиле)
│       ├── Toast.tsx        # Всплывающие уведомления (success/error)
│       ├── ProgressBar.tsx  # Прогресс-бар (цвета: primary/emerald/rose/blue/amber/violet)
│       ├── StatCard.tsx     # Карточка со статистикой
│       ├── EmptyState.tsx   # Заглушка для пустых списков
│       ├── Spinner.tsx      # Спиннер + PageLoader
│       └── LanguageSwitcher.tsx  # Переключатель РУС / ENG / ҚАЗ
│
├── i18n/
│   ├── index.ts            # Инициализация i18next, localStorage persistence
│   └── locales/
│       ├── ru.ts           # Русский (язык по умолчанию)
│       ├── en.ts           # Английский
│       └── kk.ts           # Казахский (кириллица)
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── GoalsPage.tsx
│   ├── FinancePage.tsx
│   ├── AnalyticsPage.tsx
│   ├── TestsPage.tsx
│   ├── FriendsPage.tsx
│   ├── NotificationsPage.tsx
│   └── ProfilePage.tsx
│
├── stores/
│   └── authStore.ts        # Zustand-стор: isAuthenticated, userId, userEmail
│
├── types/
│   └── index.ts            # Все TypeScript-интерфейсы
│
├── utils/
│   ├── cn.ts               # clsx + tailwind-merge
│   └── format.ts           # formatCurrency, formatDate, formatDateTime, getDaysUntil
│
├── router.tsx              # createBrowserRouter, RequireAuth, RequireGuest
├── App.tsx                 # QueryClientProvider + RouterProvider
├── main.tsx                # Точка входа
└── index.css               # Tailwind + кастомные CSS-компоненты
```

---

## Архитектура приложения

```
┌─────────────────────────────────────────────────────┐
│                    App.tsx                          │
│   QueryClientProvider (TanStack Query)              │
│   RouterProvider (React Router v7)                  │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
   ┌──────▼──────┐      ┌──────▼──────┐
   │ AuthLayout  │      │  AppLayout  │
   │ /login      │      │ (protected) │
   │ /register   │      │             │
   └─────────────┘      │  Sidebar    │
                        │  + Outlet   │
                        └──────┬──────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
        ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
        │ Dashboard │   │  Goals    │   │  Finance  │  ...
        └───────────┘   └───────────┘   └───────────┘

Каждая страница:
  useQuery() → api/*.ts → axios (client.ts) → Backend :8080
  useMutation() → invalidateQueries() → авто-рефетч
```

**QueryClient настройки:**
```ts
{
  retry: 1,              // 1 повтор при ошибке
  staleTime: 30_000,     // кэш актуален 30 секунд
  refetchOnWindowFocus: false
}
```

---

## Аутентификация и токены

### Хранилище токенов (localStorage)

| Ключ | Значение |
|------|---------|
| `accessToken` | JWT Access Token (отправляется в каждом запросе) |
| `refreshToken` | JWT Refresh Token (только для обновления) |
| `userId` | ID текущего пользователя |
| `userEmail` | Email текущего пользователя |
| `person_lang` | Выбранный язык интерфейса (ru / en / kk) |

### Автообновление токена (src/api/client.ts)

При получении **401** от любого запроса:

```
Запрос → 401
    │
    ├── Нет refreshToken? → clearTokens() → redirect /login
    │
    ├── Уже обновляем? → запрос добавляется в очередь (failedQueue)
    │
    └── POST /auth/refresh { refreshToken }
            ├── Успех → saveTokens() → повторить все запросы из очереди
            └── Ошибка → clearTokens() → redirect /login
```

Механизм очереди (`failedQueue`) гарантирует, что при одновременных 401-ответах рефреш выполняется **только один раз**, а все остальные запросы ожидают нового токена.

### Защита маршрутов

```tsx
// RequireAuth — редиректит на /login если нет accessToken
// RequireGuest — редиректит на /dashboard если токен есть
```

---

## API — полный справочник

Базовый URL: `http://localhost:8080`  
Все запросы (кроме `/auth/login`, `/auth/register`, `/auth/refresh`) требуют заголовка:
```
Authorization: Bearer <accessToken>
```

---

### Auth

#### POST /auth/register
Регистрация нового пользователя.

**Request body:**
```json
{
  "firstName": "Asylzhan",
  "lastName": "Kabibulla",
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response 200:**
```json
{
  "userId": 3,
  "email": "user@example.com",
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "tokenType": "Bearer"
}
```

**Ошибки:** `409` — email уже зарегистрирован

---

#### POST /auth/login
Вход в систему.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response 200:** аналогично `/auth/register`

**Ошибки:** `401` — неверные данные

---

#### POST /auth/refresh
Обновление токена (вызывается автоматически интерцептором при 401).

**Request body:**
```json
{ "refreshToken": "eyJhbGci..." }
```

**Response 200:** новая пара токенов

---

#### POST /auth/logout
Инвалидация refreshToken на сервере.

**Request body:**
```json
{ "refreshToken": "eyJhbGci..." }
```

**Response 200:** пустой

---

### Users / Profile

#### GET /users/me
Профиль текущего пользователя.

**Response 200:**
```json
{
  "id": 1,
  "userId": 3,
  "firstName": "Asylzhan",
  "lastName": "Kabibulla",
  "email": "user@example.com",
  "bio": "Backend developer",
  "avatarUrl": null,
  "privacyType": "PUBLIC",
  "createdAt": "2026-01-15T10:00:00"
}
```

---

#### PUT /users/me
Обновление своего профиля.

**Request body:**
```json
{
  "firstName": "Asylzhan",
  "lastName": "Kabibulla",
  "bio": "Full-stack developer",
  "avatarUrl": "https://example.com/avatar.jpg",
  "privacyType": "PUBLIC"
}
```

**Response 200:** обновлённый UserProfile

---

#### GET /users
Список всех пользователей (используется во вкладке Discover в FriendsPage).

**Response 200:**
```json
[
  {
    "id": 1,
    "userId": 10,
    "firstName": "Aliya",
    "lastName": "Bekova",
    "email": "aliya@mail.com",
    "bio": "Люблю спорт",
    "avatarUrl": null,
    "privacyType": "PUBLIC"
  }
]
```

> Запрашивается только при открытии вкладки Discover (`enabled: tab === 'discover'`).

---

#### GET /users/{userId}
Профиль конкретного пользователя. Открывается при клике на карточку друга/пользователя.

**Response 200:** объект UserProfile  
**Response 400:** `{ "message": "This profile is private" }` — показывается заглушка с иконкой замка

---

### Friends

#### POST /users/friends/request/{userId}
Отправить заявку в друзья.

> `userId` — это числовое поле `userId` из объекта пользователя (не `id`!)

**Request body:** отсутствует

**Response 200:**
```json
{
  "id": 7,
  "requesterId": 3,
  "addresseeId": 15,
  "status": "PENDING",
  "friend": {
    "id": 2,
    "userId": 15,
    "firstName": "Dias",
    "lastName": "Seitkali",
    "email": "dias@mail.com",
    "bio": null,
    "avatarUrl": null,
    "privacyType": "PUBLIC"
  },
  "createdAt": "2026-04-26T11:30:00"
}
```

**Response 400/409:** `{ "message": "Friendship already exists with status: PENDING" }`

> После успеха `data.addresseeId` добавляется в локальный `sentRequests` Set.  
> Кнопка сразу меняется с `UserPlus` на `UserCheck` без перезагрузки страницы.

---

#### GET /users/friends/pending
Входящие заявки (где `addresseeId == текущий пользователь`).

**Response 200:**
```json
[
  {
    "id": 7,
    "requesterId": 3,
    "addresseeId": 15,
    "status": "PENDING",
    "friend": {
      "id": 1,
      "userId": 3,
      "firstName": "Asylzhan",
      "lastName": "Kabibulla",
      "email": "asylzhan@mail.com",
      "bio": null,
      "avatarUrl": null,
      "privacyType": "PUBLIC"
    },
    "createdAt": "2026-04-26T11:30:00"
  }
]
```

> `friend` — всегда **другой** человек, тот кто отправил запрос.  
> Запрашивается каждые **60 секунд** (Sidebar для бейджа + FriendsPage).  
> Оба компонента используют одинаковый Query Key `['pending-requests']` — один кэш.

---

#### PUT /users/friends/{friendshipId}/accept
Принять заявку.

> `friendshipId` — это поле `id` объекта FriendRecord (не `userId` и не `friend.id`!)

**Request body:** отсутствует  
**Response 200:** запись с `status: "ACCEPTED"`  
**Response 400:** `{ "message": "Not authorized to accept this request" }`

---

#### GET /users/friends
Список принятых друзей (status = ACCEPTED).

**Response 200:** массив FriendRecord

> `friend` — всегда другой человек, поле присутствует во всех записях.

---

#### DELETE /users/friends/{friendshipId}
Удалить из друзей.

> `friendshipId` — это поле `id` объекта FriendRecord (не `friend.id`!)

**Response 200:** пустой

---

### Goals

#### GET /goals
Список целей с фильтрацией.

**Query params (опционально):**
```
?status=ACTIVE&category=HEALTH
```

**Статусы:** `ACTIVE` | `COMPLETED` | `FAILED`  
**Категории:** `HEALTH` | `EDUCATION` | `FINANCE` | `CAREER` | `PERSONAL` | `SOCIAL` | `OTHER`

**Response 200:**
```json
[
  {
    "id": 1,
    "userId": 3,
    "title": "Выучить TypeScript",
    "description": "Изучить продвинутые типы",
    "category": "EDUCATION",
    "status": "ACTIVE",
    "periodType": "MONTHLY",
    "progressPercentage": 45,
    "deadline": "2026-06-01",
    "createdAt": "2026-01-01T00:00:00",
    "updatedAt": "2026-04-20T10:00:00"
  }
]
```

---

#### POST /goals
Создать цель.

**Request body:**
```json
{
  "title": "Выучить TypeScript",
  "description": "Описание (опционально)",
  "category": "EDUCATION",
  "periodType": "MONTHLY",
  "deadline": "2026-06-01"
}
```

**Периоды:** `DAILY` | `WEEKLY` | `MONTHLY` | `YEARLY` | `CUSTOM`  
**Response 200:** созданная цель

---

#### PUT /goals/{goalId}
Обновить прогресс цели (0–100%).

**Request body:**
```json
{ "progressPercentage": 75 }
```

**Response 200:** обновлённая цель

---

#### PATCH /goals/{goalId}/complete
Отметить как выполненную (status → COMPLETED, progress → 100%).

**Request body:** отсутствует  
**Response 200:** цель со статусом COMPLETED

---

#### DELETE /goals/{goalId}
Удалить цель.

**Response 200:** пустой

---

#### GET /goals/stats
Статистика по целям.

**Response 200:**
```json
{
  "totalGoals": 12,
  "activeGoals": 5,
  "completedGoals": 6,
  "failedGoals": 1,
  "completionRate": 85.7,
  "avgProgressPercentage": 62.3
}
```

---

### Finance

#### GET /finance/monthly
Все месячные планы пользователя.

**Response 200:** массив MonthlyPlan

---

#### POST /finance/monthly
Создать месячный план.

**Request body:**
```json
{
  "year": 2026,
  "month": 4,
  "baseIncome": 500000
}
```

**Response 200:** созданный план

---

#### GET /finance/monthly/current
Текущий месячный план (по системной дате).

**Response 200:** MonthlyPlan

---

#### GET /finance/monthly/{financeId}
Конкретный месячный план со всеми доходами и расходами.

**Response 200:**
```json
{
  "id": 1,
  "year": 2026,
  "month": 4,
  "baseIncome": 500000,
  "totalIncome": 650000,
  "totalExpenses": 280000,
  "balance": 370000,
  "spentPercentage": 43.1,
  "expensesByCategory": {
    "FOOD": 80000,
    "TRANSPORT": 30000,
    "HOUSING": 150000
  },
  "incomes": [
    {
      "id": 1,
      "amount": 500000,
      "type": "SALARY",
      "description": "Зарплата",
      "date": "2026-04-01",
      "createdAt": "2026-04-01T10:00:00"
    }
  ],
  "expenses": [
    {
      "id": 1,
      "amount": 80000,
      "category": "FOOD",
      "description": null,
      "date": "2026-04-05",
      "createdAt": "2026-04-05T12:00:00"
    }
  ]
}
```

---

#### POST /finance/monthly/{financeId}/income
Добавить доход.

**Request body:**
```json
{
  "amount": 150000,
  "type": "FREELANCE",
  "date": "2026-04-15",
  "description": "Проект для клиента"
}
```

**Типы дохода:** `SALARY` | `FREELANCE` | `INVESTMENT` | `GIFT` | `OTHER`  
**Response 200:** созданная запись дохода

---

#### POST /finance/monthly/{financeId}/expense
Добавить расход.

**Request body:**
```json
{
  "amount": 25000,
  "category": "FOOD",
  "date": "2026-04-10",
  "description": "Продукты"
}
```

**Категории расходов:** `FOOD` | `TRANSPORT` | `HOUSING` | `HEALTHCARE` | `EDUCATION` | `ENTERTAINMENT` | `CLOTHING` | `SAVINGS` | `OTHER`  
**Response 200:** созданная запись расхода

---

#### GET /finance/stats
Суммарная финансовая статистика (по всем планам).

**Response 200:**
```json
{
  "totalIncome": 650000,
  "totalExpenses": 280000,
  "balance": 370000,
  "spentPercentage": 43.1,
  "overBudget": false
}
```

---

### Tests

#### GET /users/tests
Список доступных психологических тестов.

**Response 200:**
```json
[
  {
    "id": 1,
    "title": "Тест на стресс",
    "description": "Оцените уровень стресса",
    "questions": [
      {
        "id": 1,
        "questionText": "Как вы себя чувствуете?",
        "orderIndex": 1,
        "options": [
          { "id": 1, "optionText": "Отлично" },
          { "id": 2, "optionText": "Нормально" },
          { "id": 3, "optionText": "Плохо" }
        ]
      }
    ]
  }
]
```

---

#### POST /users/tests/take
Отправить ответы на тест.

**Request body:**
```json
{
  "testId": 1,
  "answers": {
    "1": 2,
    "2": 4,
    "3": 1
  }
}
```

> `answers` — объект вида `{ "questionId": optionId }`. Ключи — строки, значения — числа.

**Response 200:**
```json
{
  "id": 5,
  "testId": 1,
  "testTitle": "Тест на стресс",
  "stressLevel": 65,
  "motivationLevel": 70,
  "productivityLevel": 55,
  "recommendations": [
    "Сделайте перерыв каждые 90 минут",
    "Практикуйте дыхательные упражнения"
  ],
  "createdAt": "2026-04-26T14:00:00"
}
```

---

#### GET /users/tests/results
История пройденных тестов текущего пользователя.

**Response 200:** массив TestResult

---

#### GET /users/tests/stats
Средние показатели по всем пройденным тестам.

**Response 200:**
```json
{
  "avgStressLevel": 45.2,
  "avgMotivationLevel": 72.8,
  "avgProductivityLevel": 68.1,
  "totalTestsTaken": 8,
  "overallStatus": "Хорошее состояние"
}
```

---

### Analytics

#### GET /analytics/overview
Сводная аналитика — основной эндпоинт, используется на Dashboard и AnalyticsPage.

**Response 200:**
```json
{
  "goals": {
    "totalGoals": 12,
    "activeGoals": 5,
    "completedGoals": 6,
    "failedGoals": 1,
    "completionRate": 85.7,
    "avgProgressPercentage": 62.3,
    "statusChart": { "labels": ["ACTIVE", "COMPLETED", "FAILED"], "values": [5, 6, 1], "chartType": "pie" }
  },
  "finance": {
    "totalIncome": 650000,
    "totalExpenses": 280000,
    "balance": 370000,
    "spentPercentage": 43.1,
    "overBudget": false,
    "budgetChart": { "labels": ["Income", "Expenses"], "values": [650000, 280000], "chartType": "bar" }
  },
  "productivity": {
    "avgStressLevel": 45.2,
    "avgMotivationLevel": 72.8,
    "avgProductivityLevel": 68.1,
    "totalTestsTaken": 8,
    "overallStatus": "Хорошее состояние",
    "developmentScore": 74.5,
    "productivityChart": { "labels": [...], "values": [...], "chartType": "radar" }
  },
  "overallDevelopmentScore": 74.5,
  "developmentLevel": "INTERMEDIATE",
  "recommendations": {
    "recommendations": [
      "Снизьте уровень стресса — сделайте перерыв",
      "Добавьте больше целей в категорию здоровья"
    ],
    "source": "AI"
  }
}
```

**Уровни развития по баллам:**

| Уровень | Цвет |
|---------|------|
| `STARTER` | slate |
| `BEGINNER` | blue |
| `INTERMEDIATE` | indigo (primary) |
| `ADVANCED` | violet |
| `ELITE` | amber |

> Кэшируется под ключом `['analytics-overview']` и инвалидируется после создания/выполнения/удаления целей и прохождения тестов.

---

### Notifications

#### GET /notifications
Все уведомления пользователя (прочитанные и непрочитанные).

**Response 200:**
```json
[
  {
    "id": 1,
    "userId": 3,
    "title": "Дедлайн завтра",
    "message": "Цель «Выучить TypeScript» истекает завтра",
    "type": "GOAL_DEADLINE",
    "status": "UNREAD",
    "referenceId": 1,
    "createdAt": "2026-04-25T09:00:00"
  }
]
```

**Типы уведомлений:**

| Тип | Иконка | Цвет | Событие |
|-----|--------|------|---------|
| `GOAL_DEADLINE` | AlertTriangle | amber | Дедлайн цели приближается |
| `GOAL_EXPIRED` | Target | rose | Дедлайн цели истёк |
| `GOAL_COMPLETED` | CheckCircle | emerald | Цель выполнена |
| `SYSTEM` | Info | blue | Системное сообщение |

---

#### GET /notifications/unread/count
Количество непрочитанных. Опрашивается каждые **30 секунд** для бейджей в Sidebar и мобильном header.

**Response 200:** `{ "count": 3 }`

---

#### PATCH /notifications/{notificationId}/read
Отметить одно уведомление прочитанным. Вызывается кликом по карточке.

**Response 200:** обновлённое уведомление со `status: "READ"`

---

#### PATCH /notifications/read-all
Отметить все уведомления как прочитанные.

**Response 200:** пустой

---

## Стейт-менеджмент

### Zustand — authStore

Хранит данные о текущем пользователе:

```ts
interface AuthState {
  isAuthenticated: boolean;
  userId: number | null;       // используется в FriendsPage для фильтрации
  userEmail: string | null;    // отображается в нижней части Sidebar
  isLoading: boolean;
  login(data): Promise<void>;
  register(data): Promise<void>;
  logout(): Promise<void>;
  checkAuth(): void;           // синхронизация с localStorage при старте
}
```

### TanStack Query — серверный кэш

Ключи кэша и их связи:

| Query Key | Эндпоинт | Инвалидируется при |
|-----------|---------|-------------------|
| `['analytics-overview']` | GET /analytics/overview | create/complete/delete goal, take test |
| `['goals', status, cat]` | GET /goals | create/update/complete/delete goal |
| `['goal-stats']` | GET /goals/stats | create/complete/delete goal |
| `['finance-plans']` | GET /finance/monthly | createMonthly |
| `['finance-stats']` | GET /finance/stats | addIncome, addExpense |
| `['friends']` | GET /users/friends | accept, remove |
| `['pending-requests']` | GET /users/friends/pending | accept (+ refetch 60 с) |
| `['all-users']` | GET /users | — |
| `['user-profile', id]` | GET /users/{id} | — |
| `['notifications']` | GET /notifications | markRead, markAllRead |
| `['unread-count']` | GET /notifications/unread/count | markRead, markAllRead (+ refetch 30 с) |
| `['tests']` | GET /users/tests | — |
| `['test-results']` | GET /users/tests/results | takeTest |
| `['test-stats']` | GET /users/tests/stats | takeTest |
| `['profile-me']` | GET /users/me | updateMe |

---

## Роутинг

```
/  →  redirect /dashboard

Гостевые маршруты (RequireGuest):
  /login      →  LoginPage
  /register   →  RegisterPage

Защищённые маршруты (RequireAuth):
  /dashboard      →  DashboardPage
  /goals          →  GoalsPage
  /finance        →  FinancePage
  /analytics      →  AnalyticsPage
  /tests          →  TestsPage
  /friends        →  FriendsPage
  /notifications  →  NotificationsPage
  /profile        →  ProfilePage
```

`RequireAuth` проверяет наличие `accessToken` в localStorage — если нет, редирект на `/login`.  
`RequireGuest` — если токен есть, редирект на `/dashboard`.

---

## Локализация

Поддерживаются три языка: **Русский** (по умолчанию), **English**, **Қазақша**.

### Как работает

1. При инициализации читается `localStorage.getItem('person_lang')` (дефолт: `ru`)
2. При смене языка через `LanguageSwitcher` — `i18n.changeLanguage()` → обновляет `localStorage`
3. Все строки в компонентах через хук: `const { t } = useTranslation()`
4. Zod-схемы валидации определены **внутри компонента**, чтобы `t()` был доступен в сообщениях об ошибках
5. Форматирование через `Intl` адаптируется под язык:
   - `ru` → `ru-RU` (1 500 000 ₸, 26 апр. 2026 г.)
   - `en` → `en-US` ($1,500,000, Apr 26, 2026)
   - `kk` → `kk-KZ`

### Структура ключей переводов

```
brand.tagline
common.{ save, cancel, create, delete, edit, add, close, back, next, finish, loading, ... }
nav.{ dashboard, goals, finance, analytics, tests, friends, notifications, profile }
auth.{ loginTitle, loginSubtitle, registerTitle, email, password, firstName, lastName, ... }
dashboard.{ title, subtitle, levels.{STARTER|BEGINNER|INTERMEDIATE|ADVANCED|ELITE}, ... }
goals.{
  categories.{ HEALTH, EDUCATION, FINANCE, CAREER, PERSONAL, SOCIAL, OTHER }
  status.{ ACTIVE, COMPLETED, FAILED }
  periods.{ DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM }
  ...
}
finance.{
  incomeTypes.{ SALARY, FREELANCE, INVESTMENT, GIFT, OTHER }
  expenseCategories.{ FOOD, TRANSPORT, HOUSING, HEALTHCARE, EDUCATION, ENTERTAINMENT, CLOTHING, SAVINGS, OTHER }
  ...
}
analytics.{
  radar.{ motivation, productivity, antistress, goals, finance }
  levels.{ STARTER, BEGINNER, INTERMEDIATE, ADVANCED, ELITE }
  ...
}
tests.{ stress, motivation, productivity, yourMetrics, tabTests, tabHistory, ... }
friends.{ tabFriends, tabPending, tabDiscover, profileTitle, profilePrivate, ... }
notifications.{ unreadCount, markAllRead, allReadSuccess, ... }
profile.{ public, private, bio, avatarUrl, privacy, registeredAt, ... }
months.{ '1': 'January' ... '12': 'December' }
```

---

## UI-компоненты

### Modal
- Desktop: центрированное модальное окно с backdrop
- Mobile: **bottom sheet** (slide-up снизу с drag-индикатором)
- Размеры: `sm` | `md` | `lg`
- Закрывается по клику вне окна или по кнопке X

### Toast
- Всплывающие уведомления в правом нижнем углу
- `toast.success('текст')` / `toast.error('текст')`
- Автоматически исчезают через 3.5 секунды
- Максимум 3 одновременно (старые вытесняются)

### ProgressBar
- Цвета: `primary` (indigo) | `emerald` | `rose` | `blue` | `amber` | `violet`
- Размеры: `sm` | `md` | `lg`

### StatCard
- Заголовок, числовое значение, подпись, иконка, цветовая схема фона
- Цвета: `blue` | `emerald` | `violet` | `rose` | `amber`

### LanguageSwitcher
- Три кнопки: **РУС** | **ENG** | **ҚАЗ**
- Активный язык подсвечивается `bg-primary-600`
- Расположен в Sidebar (десктоп) и AuthLayout (страницы входа)

### EmptyState
- Заглушка для пустых списков: иконка, заголовок, описание, опциональная кнопка действия

---

## Стили и дизайн-система

### Тема
Тёмная на базе Tailwind slate-палитры:

| Элемент | Класс |
|---------|-------|
| Фон приложения | `bg-slate-950` |
| Фон карточек | `bg-slate-900` |
| Граница карточек | `border-slate-800` |
| Основной текст | `text-slate-100` |
| Вторичный текст | `text-slate-400` / `text-slate-500` |
| Плейсхолдеры | `text-slate-500` |

### Акцентный цвет
`primary` = Indigo — `#6366f1` (primary-500) / `#4f46e5` (primary-600)

### CSS-компоненты (src/index.css)

| Класс | Описание |
|-------|---------|
| `.card` | `bg-slate-900 border border-slate-800 rounded-2xl p-6` |
| `.card-sm` | Компактная версия: `rounded-xl p-4` |
| `.btn-primary` | Indigo фон, белый текст, `rounded-xl` |
| `.btn-secondary` | `bg-slate-800`, hover → `bg-slate-700` |
| `.btn-ghost` | Прозрачный, hover → `bg-slate-800` |
| `.btn-danger` | Красная обводка, `bg-red-600/20` |
| `.input` | `bg-slate-800 border-slate-700 rounded-xl`, focus ring — primary |
| `.label` | `text-sm font-medium text-slate-400 mb-1.5` |
| `.badge` | `rounded-full text-xs inline-flex items-center gap-1` |
| `.nav-link` | Неактивная ссылка навигации |
| `.nav-link-active` | `text-primary-400 bg-primary-600/10 border-primary-600/20` |

### Брейкпоинты

| Брейкпоинт | Ширина | Применение |
|-----------|--------|-----------|
| `xs` | 400px | Двухколоночные поля форм, адаптация мелких элементов |
| `sm` | 640px | Горизонтальные layout-переключения |
| `md` | 768px | Планшет |
| `lg` | 1024px | Десктоп: фиксированный sidebar, 2-3 колонки в гридах |
| `xl` | 1280px | 3 колонки в гридах карточек целей/друзей |
| `2xl` | 1536px | Широкие экраны |

### Анимации

| Класс | Что делает |
|-------|-----------|
| `.animate-fade-in` | Плавное появление страницы: `opacity 0 → 1`, 300ms |
| `.animate-slide-up` | Карточки: `translateY(20px) + opacity 0 → 1`, 300ms |

### Адаптивность

| Элемент | Mobile | Desktop (lg+) |
|---------|--------|---------------|
| Sidebar | Overlay drawer, slide-in слева | Фиксированный, 240px |
| Header | Sticky, кнопка Menu + название страницы + Bell | Скрыт |
| Модальные окна | Bottom sheet (slide-up снизу) | Центрированное окно |
| Грид карточек | 1 колонка | 2–3 колонки |
| Finance план | `<select>` dropdown | Боковая панель-список |
| Поля форм | 1 колонка | 2 колонки (от `xs` или `sm`) |
