# PDD Exam App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready PWA for Russian driving license exam preparation that mirrors the official ГИБДД exam experience.

**Architecture:** Next.js 14 App Router SPA-style PWA with Tailwind CSS. All state lives in localStorage (no backend). Questions stored in a static JSON file. Each screen is a Next.js route with client-side navigation; shared logic extracted into custom hooks.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, next-pwa, localStorage, Framer Motion (animations)

---

## File Map

```
pdd-exam-app/
├── app/
│   ├── layout.tsx              # Root layout, PWA meta, dark mode wrapper
│   ├── page.tsx                # Main menu
│   ├── globals.css             # Tailwind base + custom vars
│   ├── exam/page.tsx           # Exam mode (20 random questions, timed)
│   ├── tickets/page.tsx        # Ticket picker (1–40 grid)
│   ├── tickets/[id]/page.tsx   # Single ticket walkthrough
│   ├── random/page.tsx         # Random training session
│   ├── results/page.tsx        # Results screen (score, errors, retry)
│   ├── mistakes/page.tsx       # My mistakes list + retry
│   └── statistics/page.tsx     # Stats dashboard
│   └── settings/page.tsx       # Settings toggles
├── components/
│   ├── Header.tsx              # Back button + title + score badge
│   ├── QuestionCard.tsx        # Question text + image + answer buttons
│   ├── AnswerButton.tsx        # Single answer option (neutral/correct/wrong)
│   ├── ProgressBar.tsx         # Question N of M progress bar
│   ├── ResultScreen.tsx        # Score circle + status + action buttons
│   ├── TicketGrid.tsx          # 40-cell ticket selector grid
│   ├── StatCard.tsx            # Single stat tile (used in statistics)
│   └── ModeCard.tsx            # Home screen mode selection card
├── hooks/
│   ├── useSettings.ts          # Read/write settings from localStorage
│   ├── useStatistics.ts        # Read/write attempt history, compute aggregates
│   └── useExamSession.ts       # Active session state (questions, answers, index)
├── types/index.ts              # All shared TypeScript interfaces
├── data/questions.json         # Full question bank (40 tickets × ~20 questions)
├── utils/
│   ├── storage.ts              # Typed localStorage helpers
│   ├── shuffle.ts              # Fisher-Yates shuffle
│   └── scoring.ts              # Pass/fail thresholds + message lookup
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── icons/                  # PWA icons (192, 512)
│   └── images/                 # Question images (referenced in JSON)
├── next.config.js              # next-pwa config
├── tailwind.config.ts          # Theme colors, fonts
└── tsconfig.json
```

---

## Task 1: Project Bootstrap

**Files:**
- Create: `package.json`, `next.config.js`, `tailwind.config.ts`, `tsconfig.json`, `app/globals.css`

- [ ] **Step 1: Init Next.js project**

```bash
cd /Users/Konstantin/Projects/pdd-exam-app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

- [ ] **Step 2: Install dependencies**

```bash
npm install framer-motion next-pwa
npm install -D @types/node
```

- [ ] **Step 3: Configure next.config.js with PWA**

```js
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
```

- [ ] **Step 4: Configure Tailwind with custom theme**

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1A56DB',
          green: '#0E9F6E',
          red: '#E02424',
          yellow: '#FACA15',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Update globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --bg: #F9FAFB;
  --surface: #FFFFFF;
  --border: #E5E7EB;
  --text: #111827;
  --muted: #6B7280;
}

.dark {
  --bg: #111827;
  --surface: #1F2937;
  --border: #374151;
  --text: #F9FAFB;
  --muted: #9CA3AF;
}

body {
  background-color: var(--bg);
  color: var(--text);
  font-family: 'Inter', sans-serif;
}
```

- [ ] **Step 6: Create PWA manifest**

```json
// public/manifest.json
{
  "name": "Экзамен ПДД",
  "short_name": "ПДД",
  "description": "Подготовка к экзамену ПДД России",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F9FAFB",
  "theme_color": "#1A56DB",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 7: Commit**

```bash
git init && git add -A
git commit -m "feat: bootstrap Next.js PWA with Tailwind"
```

---

## Task 2: Types & Data Layer

**Files:**
- Create: `types/index.ts`, `utils/storage.ts`, `utils/shuffle.ts`, `utils/scoring.ts`, `data/questions.json`

- [ ] **Step 1: Define shared TypeScript types**

```ts
// types/index.ts

export interface Question {
  id: string;          // "1-1" = ticket 1, question 1
  question: string;
  image?: string;      // path relative to /public/images/
  options: string[];
  correctAnswer: number; // 0-based index
  explanation?: string;
}

export interface Ticket {
  ticketNumber: number;
  questions: Question[];
}

export interface QuestionBank {
  tickets: Ticket[];
}

export interface Settings {
  showAnswerImmediately: boolean; // true = show right/wrong after each answer
  shuffleQuestions: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  showAnswerImmediately: true,
  shuffleQuestions: true,
  soundEnabled: false,
  darkMode: false,
};

export interface ExamAttempt {
  id: string;
  date: string;         // ISO timestamp
  mode: 'exam' | 'ticket' | 'random';
  ticketNumber?: number;
  totalQuestions: number;
  correctCount: number;
  wrongQuestionIds: string[];
  durationSeconds: number;
}

export type ExamStatus = 'excellent' | 'passed' | 'failed';

export interface ScoringConfig {
  excellentThreshold: number;  // 1.0 = no errors
  passThreshold: number;       // 0.9 = max 2 errors in 20 questions
}

export const DEFAULT_SCORING: ScoringConfig = {
  excellentThreshold: 1.0,
  passThreshold: 0.9,  // ≤2 errors
};
```

- [ ] **Step 2: Create storage utilities**

```ts
// utils/storage.ts
import { Settings, DEFAULT_SETTINGS, ExamAttempt, ScoringConfig, DEFAULT_SCORING } from '@/types';

const KEYS = {
  SETTINGS: 'pdd_settings',
  ATTEMPTS: 'pdd_attempts',
  MISTAKES: 'pdd_mistakes',
  SCORING: 'pdd_scoring',
} as const;

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getSettings: (): Settings => get(KEYS.SETTINGS, DEFAULT_SETTINGS),
  saveSettings: (s: Settings) => set(KEYS.SETTINGS, s),

  getAttempts: (): ExamAttempt[] => get(KEYS.ATTEMPTS, []),
  addAttempt: (a: ExamAttempt) => {
    const attempts = get<ExamAttempt[]>(KEYS.ATTEMPTS, []);
    set(KEYS.ATTEMPTS, [a, ...attempts].slice(0, 100)); // keep last 100
  },

  getMistakeIds: (): string[] => get(KEYS.MISTAKES, []),
  addMistakeIds: (ids: string[]) => {
    const existing = new Set(get<string[]>(KEYS.MISTAKES, []));
    ids.forEach(id => existing.add(id));
    set(KEYS.MISTAKES, Array.from(existing));
  },
  removeMistakeId: (id: string) => {
    const existing = get<string[]>(KEYS.MISTAKES, []);
    set(KEYS.MISTAKES, existing.filter(i => i !== id));
  },

  getScoringConfig: (): ScoringConfig => get(KEYS.SCORING, DEFAULT_SCORING),

  clearAll: () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};
```

- [ ] **Step 3: Create shuffle utility**

```ts
// utils/shuffle.ts
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

- [ ] **Step 4: Create scoring utility**

```ts
// utils/scoring.ts
import { ExamStatus, ScoringConfig } from '@/types';

export function getExamStatus(
  correct: number,
  total: number,
  config: ScoringConfig
): ExamStatus {
  const ratio = correct / total;
  if (ratio >= config.excellentThreshold) return 'excellent';
  if (ratio >= config.passThreshold) return 'passed';
  return 'failed';
}

export const STATUS_MESSAGES: Record<ExamStatus, { title: string; subtitle: string; color: string }> = {
  excellent: {
    title: 'Отлично! Экзамен сдан!',
    subtitle: 'Вы ответили на все вопросы правильно.',
    color: 'text-brand-green',
  },
  passed: {
    title: 'Экзамен почти сдан',
    subtitle: 'Есть небольшие ошибки. Повторите сложные темы.',
    color: 'text-brand-yellow',
  },
  failed: {
    title: 'Экзамен не сдан',
    subtitle: 'Слишком много ошибок. Рекомендуется пройти тренировку ещё раз.',
    color: 'text-brand-red',
  },
};
```

- [ ] **Step 5: Create sample questions JSON (2 full tickets as demo)**

Create `data/questions.json` with Tickets 1 and 2, each containing 20 questions representing real ГИБДД exam categories (right-of-way, signs, speed limits, parking, etc.). See full JSON below.

```json
{
  "tickets": [
    {
      "ticketNumber": 1,
      "questions": [
        {
          "id": "1-1",
          "question": "Как обозначается на схемах дорог главная дорога?",
          "options": ["Жёлтой линией", "Широкой линией", "Линией с засечками"],
          "correctAnswer": 1,
          "explanation": "На схемах главная дорога обозначается более широкой линией."
        },
        {
          "id": "1-2",
          "question": "Что означает знак с красным треугольником и восклицательным знаком внутри?",
          "options": ["Прочие опасности", "Пересечение с велодорожкой", "Скользкая дорога"],
          "correctAnswer": 0,
          "explanation": "Знак 1.33 «Прочие опасности» — предупреждает о различных опасностях, не обозначенных другими знаками."
        },
        {
          "id": "1-3",
          "question": "С какой стороны разрешается обгон?",
          "options": ["Только справа", "Только слева", "С любой стороны"],
          "correctAnswer": 1,
          "explanation": "Обгон разрешается только слева, если это не противоречит требованиям ПДД."
        },
        {
          "id": "1-4",
          "question": "Каков максимальный допустимый уровень алкоголя в крови водителя?",
          "options": ["0,3 промилле", "0,2 промилле", "Нулевая толерантность — ноль промилле"],
          "correctAnswer": 2,
          "explanation": "В России установлена нулевая терпимость к алкоголю за рулём."
        },
        {
          "id": "1-5",
          "question": "На каком расстоянии от пешеходного перехода запрещена остановка?",
          "options": ["За 5 метров до него", "За 10 метров до него", "За 3 метров до него"],
          "correctAnswer": 1,
          "explanation": "Остановка запрещена менее чем за 5 м перед пешеходным переходом, но ПДД требует 10 м при наличии стоп-линии."
        },
        {
          "id": "1-6",
          "question": "Что означает сплошная белая линия разметки посередине дороги?",
          "options": [
            "Разделяет потоки движения и пересечение запрещено",
            "Можно пересечь только для обгона",
            "Разделяет полосы попутного движения"
          ],
          "correctAnswer": 0,
          "explanation": "Сплошная линия разметки 1.1 разделяет транспортные потоки противоположных направлений и пересечение запрещено."
        },
        {
          "id": "1-7",
          "question": "Кому предоставляется преимущество при въезде на круговое движение (в России по умолчанию)?",
          "options": [
            "Въезжающим на круг",
            "Движущимся по кругу",
            "Тому, кто справа"
          ],
          "correctAnswer": 1,
          "explanation": "Если знак 4.3 «Круговое движение» сопровождается знаком 2.4 «Уступите дорогу», преимущество у движущихся по кругу."
        },
        {
          "id": "1-8",
          "question": "Какова максимальная скорость движения в населённом пункте?",
          "options": ["40 км/ч", "60 км/ч", "80 км/ч"],
          "correctAnswer": 1,
          "explanation": "В населённых пунктах максимально допустимая скорость — 60 км/ч (ПДД п. 10.2)."
        },
        {
          "id": "1-9",
          "question": "При каком цвете светофора разрешается поворот направо, если нет запрещающих знаков?",
          "options": [
            "Только при зелёном сигнале",
            "При зелёном сигнале или зелёной стрелке-секции",
            "При любом сигнале, уступив дорогу"
          ],
          "correctAnswer": 1,
          "explanation": "Поворот направо разрешён при зелёном сигнале или при включённой дополнительной секции с зелёной стрелкой."
        },
        {
          "id": "1-10",
          "question": "Что должен сделать водитель при ДТП с пострадавшими?",
          "options": [
            "Уехать и вызвать скорую по телефону",
            "Остановиться, включить аварийку, выставить знак, оказать помощь и вызвать ГИБДД",
            "Зафиксировать повреждения и уехать"
          ],
          "correctAnswer": 1,
          "explanation": "Водитель обязан остановиться, не перемещать транспортные средства, включить аварийку, выставить знак и вызвать экстренные службы."
        },
        {
          "id": "1-11",
          "question": "Разрешается ли движение задним ходом на перекрёстках?",
          "options": [
            "Да, всегда",
            "Нет, запрещено",
            "Только на нерегулируемых перекрёстках"
          ],
          "correctAnswer": 1,
          "explanation": "Движение задним ходом на перекрёстках запрещено (ПДД п. 8.12)."
        },
        {
          "id": "1-12",
          "question": "Какое минимальное расстояние должно быть выставлено предупреждающего знака аварийной остановки за городом?",
          "options": ["15 метров", "30 метров", "50 метров"],
          "correctAnswer": 2,
          "explanation": "За городом знак аварийной остановки выставляется не ближе 30 м, а предпочтительно 50 м."
        },
        {
          "id": "1-13",
          "question": "Кто имеет преимущество при одновременном подъезде к нерегулируемому перекрёстку равнозначных дорог?",
          "options": ["Кто едет прямо", "Помеха справа", "Кто едет быстрее"],
          "correctAnswer": 1,
          "explanation": "На перекрёстке равнозначных дорог действует правило «помехи справа» — преимущество у того, кто находится справа."
        },
        {
          "id": "1-14",
          "question": "Когда обязательно использование ближнего света фар в дневное время?",
          "options": [
            "Только в туман",
            "При движении в жилой зоне",
            "В любое время суток при движении вне населённого пункта"
          ],
          "correctAnswer": 2,
          "explanation": "Ближний свет или ДХО обязательны при движении вне населённых пунктов в любое время суток."
        },
        {
          "id": "1-15",
          "question": "Что означает знак «Пешеходный переход» (белый треугольник на синем фоне)?",
          "options": [
            "Нерегулируемый пешеходный переход впереди",
            "Запрет для пешеходов",
            "Парковка для инвалидов"
          ],
          "correctAnswer": 0,
          "explanation": "Знак 5.19 «Пешеходный переход» обозначает место, где переход проезжей части разрешён пешеходам."
        },
        {
          "id": "1-16",
          "question": "Разрешено ли использовать мобильный телефон без гарнитуры hands-free во время движения?",
          "options": ["Да, если движение медленное", "Нет, запрещено", "Да, на любой скорости"],
          "correctAnswer": 1,
          "explanation": "Использование телефона без hands-free во время движения запрещено ПДД."
        },
        {
          "id": "1-17",
          "question": "Что означает мигающий жёлтый сигнал светофора?",
          "options": [
            "Стоп",
            "Внимание, нерегулируемый перекрёсток или опасный участок",
            "Разрешено движение в любом направлении"
          ],
          "correctAnswer": 1,
          "explanation": "Мигающий жёлтый сигнал означает, что перекрёсток нерегулируемый, и водитель должен быть особенно внимательным."
        },
        {
          "id": "1-18",
          "question": "На каком расстоянии необходимо включить указатель поворота перед манёвром в населённом пункте?",
          "options": ["Не менее 30 метров", "Не менее 50 метров", "Непосредственно перед манёвром"],
          "correctAnswer": 0,
          "explanation": "Указатель поворота необходимо включить заблаговременно, не менее чем за 30 м до манёвра в населённом пункте."
        },
        {
          "id": "1-19",
          "question": "Разрешена ли остановка на трамвайных путях?",
          "options": ["Да, если нет трамвая", "Нет, запрещена", "Да, не более чем на 5 минут"],
          "correctAnswer": 1,
          "explanation": "Остановка и стоянка на трамвайных путях запрещена ПДД."
        },
        {
          "id": "1-20",
          "question": "Каков минимальный возраст для получения водительского удостоверения категории «В» в России?",
          "options": ["16 лет", "17 лет", "18 лет"],
          "correctAnswer": 2,
          "explanation": "Водительское удостоверение категории «В» выдаётся лицам, достигшим 18 лет."
        }
      ]
    },
    {
      "ticketNumber": 2,
      "questions": [
        {
          "id": "2-1",
          "question": "Что означает знак с красным кругом и цифрой 40 внутри?",
          "options": [
            "Рекомендуемая скорость 40 км/ч",
            "Ограничение максимальной скорости 40 км/ч",
            "Минимальная скорость 40 км/ч"
          ],
          "correctAnswer": 1,
          "explanation": "Знак 3.24 «Ограничение максимальной скорости» — запрещается движение со скоростью, превышающей указанную."
        },
        {
          "id": "2-2",
          "question": "Какой сигнал должен подать водитель перед началом движения задним ходом?",
          "options": [
            "Звуковой сигнал",
            "Световой сигнал правого поворота",
            "Никакого — движение задним ходом не требует сигнала"
          ],
          "correctAnswer": 0,
          "explanation": "Перед началом движения задним ходом водитель должен убедиться в безопасности манёвра."
        },
        {
          "id": "2-3",
          "question": "При каких условиях разрешён обгон на пешеходном переходе?",
          "options": [
            "Если нет пешеходов",
            "Если разметка не запрещает",
            "Запрещён всегда"
          ],
          "correctAnswer": 2,
          "explanation": "Обгон на пешеходных переходах запрещён в любом случае (ПДД п. 11.4)."
        },
        {
          "id": "2-4",
          "question": "Каков максимально допустимый размер груза, выступающего сзади транспортного средства без специального обозначения?",
          "options": ["500 мм", "1000 мм", "2000 мм"],
          "correctAnswer": 1,
          "explanation": "Груз, выступающий сзади более чем на 1 м, должен быть обозначен знаком «Крупногабаритный груз» или световозвращателем."
        },
        {
          "id": "2-5",
          "question": "При движении по автомагистрали разрешено ли разворачиваться через разрыв в разделительной полосе?",
          "options": [
            "Да, если нет других машин",
            "Нет, запрещено",
            "Да, только для спецслужб"
          ],
          "correctAnswer": 1,
          "explanation": "На автомагистралях разворот через разрыв в разделительной полосе запрещён."
        },
        {
          "id": "2-6",
          "question": "Что должен сделать водитель при появлении тумана на дороге?",
          "options": [
            "Включить дальний свет фар",
            "Включить противотуманные фары и снизить скорость",
            "Продолжать движение с прежней скоростью"
          ],
          "correctAnswer": 1,
          "explanation": "При тумане необходимо включить противотуманные фары (или ближний свет) и снизить скорость до безопасной."
        },
        {
          "id": "2-7",
          "question": "Разрешено ли обгонять транспортное средство, которое само совершает обгон?",
          "options": [
            "Да, если хватает места",
            "Нет, запрещено",
            "Да, только на дорогах с тремя полосами"
          ],
          "correctAnswer": 1,
          "explanation": "Обгон транспортного средства, которое само совершает обгон, запрещён (ПДД п. 11.2)."
        },
        {
          "id": "2-8",
          "question": "Где разрешена стоянка автомобиля?",
          "options": [
            "На тротуаре, если не мешаете пешеходам",
            "На специально отведённых для этого местах или на обочине",
            "В любом удобном месте"
          ],
          "correctAnswer": 1,
          "explanation": "Стоянка разрешена только в специально отведённых местах или на правой стороне проезжей части (обочине)."
        },
        {
          "id": "2-9",
          "question": "Какие огни должны быть включены при стоянке автомобиля ночью за городом?",
          "options": [
            "Дальний свет фар",
            "Ближний свет фар",
            "Стояночные огни или габаритные огни"
          ],
          "correctAnswer": 2,
          "explanation": "При вынужденной остановке ночью за городом необходимо включить стояночные (габаритные) огни."
        },
        {
          "id": "2-10",
          "question": "Кому уступает дорогу водитель, выезжающий с грунтовой дороги на дорогу без знаков?",
          "options": [
            "Никому — у него преимущество",
            "Только транспортным средствам слева",
            "Всем транспортным средствам на дороге, с которой он выезжает"
          ],
          "correctAnswer": 2,
          "explanation": "Грунтовая дорога считается второстепенной: водитель должен уступить дорогу всем, кто движется по основной дороге."
        },
        {
          "id": "2-11",
          "question": "Допускается ли движение на красный сигнал светофора при разрешающем жесте регулировщика?",
          "options": [
            "Нет, сигнал светофора важнее",
            "Да, жест регулировщика имеет приоритет над сигналом светофора",
            "Только для маршрутных транспортных средств"
          ],
          "correctAnswer": 1,
          "explanation": "Сигналы регулировщика имеют приоритет над сигналами светофора."
        },
        {
          "id": "2-12",
          "question": "Обязан ли водитель пропустить пешехода, который только вышел на пешеходный переход?",
          "options": [
            "Да, обязан",
            "Нет, только если пешеход уже на его полосе",
            "Только если пешеход идёт слева"
          ],
          "correctAnswer": 0,
          "explanation": "Водитель обязан уступить дорогу пешеходам, переходящим проезжую часть по нерегулируемому пешеходному переходу."
        },
        {
          "id": "2-13",
          "question": "При каком условии допускается превышение скорости при обгоне?",
          "options": [
            "Если дорога пустая",
            "Если это необходимо для безопасного обгона",
            "Ни при каких условиях"
          ],
          "correctAnswer": 2,
          "explanation": "Превышение установленной скорости для совершения обгона не допускается ни при каких условиях."
        },
        {
          "id": "2-14",
          "question": "Что означает знак с голубым кругом и белой стрелкой вверх?",
          "options": [
            "Главная дорога",
            "Движение прямо обязательно",
            "Рекомендуемое направление"
          ],
          "correctAnswer": 1,
          "explanation": "Знак 4.1.1 «Движение прямо» обязывает водителя двигаться только в указанном направлении."
        },
        {
          "id": "2-15",
          "question": "Разрешена ли езда на велосипеде по проезжей части дорог при наличии велосипедной дорожки?",
          "options": [
            "Да, по крайней правой полосе",
            "Нет, велосипедист обязан пользоваться велосипедной дорожкой",
            "Да, при скорости менее 20 км/ч"
          ],
          "correctAnswer": 1,
          "explanation": "При наличии велосипедной дорожки движение велосипедиста по проезжей части запрещено."
        },
        {
          "id": "2-16",
          "question": "Каков максимально допустимый уровень тонировки лобового стекла?",
          "options": ["Не менее 70% светопропускания", "Не менее 50% светопропускания", "Любой — закон не регулирует"],
          "correctAnswer": 0,
          "explanation": "Светопропускаемость лобового стекла должна быть не менее 70% по ГОСТ Р 5727-2014."
        },
        {
          "id": "2-17",
          "question": "Какое из следующих действий является обязательным при приближении автомобиля скорой помощи с включёнными спецсигналами?",
          "options": [
            "Увеличить скорость и уехать с дороги",
            "Немедленно остановиться на обочине",
            "Уступить дорогу, при необходимости съехав на обочину"
          ],
          "correctAnswer": 2,
          "explanation": "Водитель обязан уступить дорогу транспортным средствам с включёнными спецсигналами (ПДД п. 3.2)."
        },
        {
          "id": "2-18",
          "question": "Допускается ли движение по полосе для маршрутных транспортных средств?",
          "options": [
            "Нет, никогда",
            "Только для посадки/высадки пассажиров и поворота",
            "Да, если нет маршрутных ТС"
          ],
          "correctAnswer": 1,
          "explanation": "Въезд на полосу для маршрутных ТС допускается только для посадки/высадки пассажиров или выполнения поворота."
        },
        {
          "id": "2-19",
          "question": "Какую сторону дороги должен придерживаться пешеход при движении вне тротуара?",
          "options": [
            "Правую сторону по ходу движения",
            "Левую сторону навстречу движению транспорта",
            "Любую удобную сторону"
          ],
          "correctAnswer": 1,
          "explanation": "Пешеход вне тротуара должен идти по левому краю проезжей части или обочины навстречу движению транспорта."
        },
        {
          "id": "2-20",
          "question": "Что следует делать, если после выезда с прилегающей территории отсутствуют знаки приоритета?",
          "options": [
            "Продолжать движение — у вас преимущество",
            "Уступить дорогу всем транспортным средствам на дороге",
            "Уступить дорогу только транспортным средствам слева"
          ],
          "correctAnswer": 1,
          "explanation": "При выезде с прилегающей территории водитель обязан уступить дорогу всем участникам движения на дороге."
        }
      ]
    }
  ]
}
```

> **Note:** The remaining 38 tickets (3–40) must be populated from the official PDF. The JSON structure above is the template. Use a PDF extraction script (see Task 9) to generate the full dataset.

- [ ] **Step 6: Commit**

```bash
git add types/ utils/ data/
git commit -m "feat: add types, storage utils, and sample question data"
```

---

## Task 3: Core Hooks

**Files:**
- Create: `hooks/useSettings.ts`, `hooks/useStatistics.ts`, `hooks/useExamSession.ts`

- [ ] **Step 1: Create useSettings hook**

```ts
// hooks/useSettings.ts
'use client';
import { useState, useEffect } from 'react';
import { Settings, DEFAULT_SETTINGS } from '@/types';
import { storage } from '@/utils/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(storage.getSettings());
  }, []);

  useEffect(() => {
    // Apply dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    storage.saveSettings(next);
  };

  return { settings, updateSettings };
}
```

- [ ] **Step 2: Create useStatistics hook**

```ts
// hooks/useStatistics.ts
'use client';
import { useState, useEffect } from 'react';
import { ExamAttempt } from '@/types';
import { storage } from '@/utils/storage';

export interface Statistics {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  totalQuestions: number;
  totalCorrect: number;
  recentAttempts: ExamAttempt[];
  mistakeCount: number;
}

export function useStatistics() {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [mistakeIds, setMistakeIds] = useState<string[]>([]);

  useEffect(() => {
    setAttempts(storage.getAttempts());
    setMistakeIds(storage.getMistakeIds());
  }, []);

  const stats: Statistics = {
    totalAttempts: attempts.length,
    averageScore: attempts.length
      ? Math.round(attempts.reduce((s, a) => s + a.correctCount / a.totalQuestions, 0) / attempts.length * 100)
      : 0,
    bestScore: attempts.length
      ? Math.max(...attempts.map(a => Math.round(a.correctCount / a.totalQuestions * 100)))
      : 0,
    totalQuestions: attempts.reduce((s, a) => s + a.totalQuestions, 0),
    totalCorrect: attempts.reduce((s, a) => s + a.correctCount, 0),
    recentAttempts: attempts.slice(0, 5),
    mistakeCount: mistakeIds.length,
  };

  const addAttempt = (attempt: ExamAttempt) => {
    storage.addAttempt(attempt);
    storage.addMistakeIds(attempt.wrongQuestionIds);
    setAttempts(storage.getAttempts());
    setMistakeIds(storage.getMistakeIds());
  };

  const clearAll = () => {
    storage.clearAll();
    setAttempts([]);
    setMistakeIds([]);
  };

  return { stats, attempts, mistakeIds, addAttempt, clearAll };
}
```

- [ ] **Step 3: Create useExamSession hook**

```ts
// hooks/useExamSession.ts
'use client';
import { useState, useCallback, useRef } from 'react';
import { Question } from '@/types';

export type AnswerState = 'unanswered' | 'correct' | 'wrong';

interface SessionState {
  questions: Question[];
  currentIndex: number;
  answers: (number | null)[];
  answerStates: AnswerState[];
  startTime: number;
}

export function useExamSession(questions: Question[]) {
  const startTime = useRef(Date.now());
  const [state, setState] = useState<SessionState>({
    questions,
    currentIndex: 0,
    answers: new Array(questions.length).fill(null),
    answerStates: new Array(questions.length).fill('unanswered'),
    startTime: Date.now(),
  });

  const currentQuestion = state.questions[state.currentIndex];
  const isLast = state.currentIndex === state.questions.length - 1;
  const isAnswered = state.answers[state.currentIndex] !== null;

  const selectAnswer = useCallback((optionIndex: number, showImmediately: boolean) => {
    setState(prev => {
      if (prev.answers[prev.currentIndex] !== null) return prev; // already answered
      const correct = prev.questions[prev.currentIndex].correctAnswer === optionIndex;
      const newAnswers = [...prev.answers];
      const newStates = [...prev.answerStates];
      newAnswers[prev.currentIndex] = optionIndex;
      if (showImmediately) {
        newStates[prev.currentIndex] = correct ? 'correct' : 'wrong';
      }
      return { ...prev, answers: newAnswers, answerStates: newStates };
    });
  }, []);

  const revealAllAnswers = useCallback(() => {
    setState(prev => ({
      ...prev,
      answerStates: prev.answers.map((ans, i) =>
        ans === null ? 'unanswered' :
        ans === prev.questions[i].correctAnswer ? 'correct' : 'wrong'
      ),
    }));
  }, []);

  const goNext = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length - 1),
    }));
  }, []);

  const goBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
    }));
  }, []);

  const getResults = useCallback(() => {
    const correctCount = state.answers.filter(
      (ans, i) => ans === state.questions[i].correctAnswer
    ).length;
    const wrongQuestionIds = state.questions
      .filter((q, i) => state.answers[i] !== null && state.answers[i] !== q.correctAnswer)
      .map(q => q.id);
    const durationSeconds = Math.round((Date.now() - startTime.current) / 1000);
    return { correctCount, wrongQuestionIds, durationSeconds, totalQuestions: state.questions.length };
  }, [state]);

  return {
    currentQuestion,
    currentIndex: state.currentIndex,
    totalQuestions: state.questions.length,
    isLast,
    isAnswered,
    answers: state.answers,
    answerStates: state.answerStates,
    selectAnswer,
    revealAllAnswers,
    goNext,
    goBack,
    getResults,
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add hooks/
git commit -m "feat: add useSettings, useStatistics, useExamSession hooks"
```

---

## Task 4: UI Components

**Files:**
- Create: `components/Header.tsx`, `components/ProgressBar.tsx`, `components/AnswerButton.tsx`, `components/QuestionCard.tsx`, `components/ModeCard.tsx`, `components/StatCard.tsx`

- [ ] **Step 1: Header component**

```tsx
// components/Header.tsx
'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function Header({ title, showBack = true, rightElement }: HeaderProps) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Назад"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
      )}
      <h1 className="flex-1 text-base font-semibold text-gray-900 dark:text-white">{title}</h1>
      {rightElement}
    </header>
  );
}
```

- [ ] **Step 2: ProgressBar component**

```tsx
// components/ProgressBar.tsx
interface ProgressBarProps {
  current: number;
  total: number;
  correctCount?: number;
}

export function ProgressBar({ current, total, correctCount }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="px-4 py-2">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>Вопрос {current} из {total}</span>
        {correctCount !== undefined && (
          <span className="text-brand-green font-medium">{correctCount} правильно</span>
        )}
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-blue rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: AnswerButton component**

```tsx
// components/AnswerButton.tsx
'use client';

interface AnswerButtonProps {
  label: string;
  index: number;
  state: 'default' | 'selected' | 'correct' | 'wrong' | 'disabled-correct';
  onClick: () => void;
}

const stateClasses = {
  default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-blue hover:bg-blue-50 dark:hover:bg-blue-950 text-gray-900 dark:text-white',
  selected: 'bg-blue-50 dark:bg-blue-950 border-brand-blue text-brand-blue',
  correct: 'bg-green-50 dark:bg-green-950 border-brand-green text-brand-green',
  wrong: 'bg-red-50 dark:bg-red-950 border-brand-red text-brand-red',
  'disabled-correct': 'bg-green-50 dark:bg-green-950 border-brand-green text-brand-green opacity-80',
};

const optionLetters = ['А', 'Б', 'В', 'Г', 'Д'];

export function AnswerButton({ label, index, state, onClick }: AnswerButtonProps) {
  const isDisabled = state !== 'default';
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150 ${stateClasses[state]} disabled:cursor-default`}
    >
      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-current/10 flex items-center justify-center text-sm font-bold">
        {optionLetters[index]}
      </span>
      <span className="text-sm font-medium leading-snug pt-0.5">{label}</span>
    </button>
  );
}
```

- [ ] **Step 4: QuestionCard component**

```tsx
// components/QuestionCard.tsx
'use client';
import Image from 'next/image';
import { Question } from '@/types';
import { AnswerButton } from './AnswerButton';
import { AnswerState } from '@/hooks/useExamSession';

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  answerState: AnswerState;
  showImmediately: boolean;
  onSelectAnswer: (index: number) => void;
}

export function QuestionCard({
  question,
  selectedAnswer,
  answerState,
  showImmediately,
  onSelectAnswer,
}: QuestionCardProps) {
  const getButtonState = (optionIndex: number) => {
    if (selectedAnswer === null) return 'default';
    if (!showImmediately) return optionIndex === selectedAnswer ? 'selected' : 'default';
    if (optionIndex === question.correctAnswer) return 'correct';
    if (optionIndex === selectedAnswer) return 'wrong';
    return 'default';
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <p className="text-base font-medium text-gray-900 dark:text-white leading-relaxed">
          {question.question}
        </p>
        {question.image && (
          <div className="mt-3 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
            <Image
              src={question.image}
              alt="Иллюстрация к вопросу"
              width={600}
              height={300}
              className="w-full object-contain max-h-48"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {question.options.map((option, idx) => (
          <AnswerButton
            key={idx}
            label={option}
            index={idx}
            state={getButtonState(idx)}
            onClick={() => onSelectAnswer(idx)}
          />
        ))}
      </div>

      {showImmediately && selectedAnswer !== null && question.explanation && (
        <div className={`p-3 rounded-xl text-sm leading-relaxed ${
          answerState === 'correct'
            ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'
        }`}>
          <span className="font-semibold">{answerState === 'correct' ? '✓ Правильно. ' : '✗ Неправильно. '}</span>
          {question.explanation}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: ModeCard component**

```tsx
// components/ModeCard.tsx
'use client';

interface ModeCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}

export function ModeCard({ icon, title, description, color, onClick }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-brand-blue/30 transition-all text-left active:scale-[0.98]"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color} flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="font-semibold text-gray-900 dark:text-white text-sm">{title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
      </div>
      <div className="ml-auto text-gray-400 dark:text-gray-500 text-lg">›</div>
    </button>
  );
}
```

- [ ] **Step 6: StatCard component**

```tsx
// components/StatCard.tsx
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function StatCard({ label, value, sub, color = 'text-brand-blue' }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}
```

- [ ] **Step 7: Install heroicons**

```bash
npm install @heroicons/react
```

- [ ] **Step 8: Commit**

```bash
git add components/
git commit -m "feat: add reusable UI components"
```

---

## Task 5: Root Layout & Main Menu

**Files:**
- Create/Modify: `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Root layout**

```tsx
// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Экзамен ПДД',
  description: 'Подготовка к экзамену ПДД России',
  manifest: '/manifest.json',
  themeColor: '#1A56DB',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'ПДД' },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <div className="max-w-lg mx-auto min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Main menu page**

```tsx
// app/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useStatistics } from '@/hooks/useStatistics';
import { ModeCard } from '@/components/ModeCard';

const MODES = [
  { icon: '🎓', title: 'Начать экзамен', description: '20 случайных вопросов, как на настоящем экзамене', color: 'bg-blue-100 dark:bg-blue-900', href: '/exam' },
  { icon: '📋', title: 'Тренировка по билетам', description: 'Выберите билет 1–40 и пройдите его полностью', color: 'bg-purple-100 dark:bg-purple-900', href: '/tickets' },
  { icon: '🎲', title: 'Случайные вопросы', description: 'Быстрая тренировка из случайных вопросов', color: 'bg-orange-100 dark:bg-orange-900', href: '/random' },
  { icon: '❌', title: 'Мои ошибки', description: 'Повторите вопросы, где вы ошибались', color: 'bg-red-100 dark:bg-red-900', href: '/mistakes' },
  { icon: '📊', title: 'Статистика', description: 'Ваши результаты и история', color: 'bg-green-100 dark:bg-green-900', href: '/statistics' },
  { icon: '⚙️', title: 'Настройки', description: 'Темная тема, звук и другие параметры', color: 'bg-gray-100 dark:bg-gray-700', href: '/settings' },
];

export default function HomePage() {
  const router = useRouter();
  const { stats } = useStatistics();

  return (
    <main className="flex flex-col gap-0 pb-8">
      {/* Hero */}
      <div className="bg-brand-blue text-white px-5 pt-12 pb-8">
        <div className="text-3xl font-bold mb-1">Экзамен ПДД 🇷🇺</div>
        <div className="text-blue-200 text-sm">Подготовка к экзамену ГИБДД</div>
        {stats.totalAttempts > 0 && (
          <div className="mt-4 bg-white/15 rounded-xl px-4 py-3 text-sm">
            Попыток: <span className="font-bold">{stats.totalAttempts}</span>
            &nbsp;·&nbsp;Средний балл: <span className="font-bold">{stats.averageScore}%</span>
            &nbsp;·&nbsp;Ошибок: <span className="font-bold">{stats.mistakeCount}</span>
          </div>
        )}
      </div>

      {/* Mode cards */}
      <div className="px-4 pt-6 flex flex-col gap-3">
        {MODES.map((mode) => (
          <ModeCard
            key={mode.href}
            icon={mode.icon}
            title={mode.title}
            description={mode.description}
            color={mode.color}
            onClick={() => router.push(mode.href)}
          />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: add root layout and main menu"
```

---

## Task 6: Exam Mode

**Files:**
- Create: `app/exam/page.tsx`

- [ ] **Step 1: Exam mode page**

```tsx
// app/exam/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import questionBank from '@/data/questions.json';
import { useExamSession } from '@/hooks/useExamSession';
import { useSettings } from '@/hooks/useSettings';
import { useStatistics } from '@/hooks/useStatistics';
import { shuffle } from '@/utils/shuffle';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { QuestionCard } from '@/components/QuestionCard';
import { Question, ExamAttempt } from '@/types';

const EXAM_QUESTION_COUNT = 20;

export default function ExamPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const { addAttempt } = useStatistics();
  const [questions] = useState<Question[]>(() => {
    const all: Question[] = questionBank.tickets.flatMap(t => t.questions);
    return shuffle(all).slice(0, EXAM_QUESTION_COUNT);
  });

  const session = useExamSession(questions);
  const correctCount = session.answers.filter((a, i) => a === questions[i]?.correctAnswer).length;

  const handleFinish = () => {
    if (!settings.showAnswerImmediately) {
      session.revealAllAnswers();
    }
    const results = session.getResults();
    const attempt: ExamAttempt = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mode: 'exam',
      totalQuestions: results.totalQuestions,
      correctCount: results.correctCount,
      wrongQuestionIds: results.wrongQuestionIds,
      durationSeconds: results.durationSeconds,
    };
    addAttempt(attempt);
    // Store results for results page
    sessionStorage.setItem('lastAttempt', JSON.stringify(attempt));
    router.push('/results');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Экзамен"
        rightElement={
          <div className="text-sm font-semibold text-brand-blue">
            {correctCount}/{session.totalQuestions}
          </div>
        }
      />
      <ProgressBar
        current={session.currentIndex + 1}
        total={session.totalQuestions}
        correctCount={settings.showAnswerImmediately ? correctCount : undefined}
      />

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <QuestionCard
          question={session.currentQuestion}
          selectedAnswer={session.answers[session.currentIndex]}
          answerState={session.answerStates[session.currentIndex]}
          showImmediately={settings.showAnswerImmediately}
          onSelectAnswer={(idx) => session.selectAnswer(idx, settings.showAnswerImmediately)}
        />
      </div>

      <div className="px-4 pb-6 pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-3">
        {session.isLast ? (
          <button
            onClick={handleFinish}
            className="flex-1 bg-brand-blue text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Завершить экзамен
          </button>
        ) : (
          <button
            onClick={session.goNext}
            disabled={!session.isAnswered}
            className="flex-1 bg-brand-blue text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Следующий вопрос →
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/exam/
git commit -m "feat: add exam mode page"
```

---

## Task 7: Tickets Mode

**Files:**
- Create: `app/tickets/page.tsx`, `app/tickets/[id]/page.tsx`, `components/TicketGrid.tsx`

- [ ] **Step 1: Ticket grid component**

```tsx
// components/TicketGrid.tsx
'use client';
import { useStatistics } from '@/hooks/useStatistics';

interface TicketGridProps {
  totalTickets: number;
  onSelect: (ticketNumber: number) => void;
}

export function TicketGrid({ totalTickets, onSelect }: TicketGridProps) {
  const { attempts } = useStatistics();
  const completedTickets = new Set(
    attempts.filter(a => a.mode === 'ticket' && a.ticketNumber).map(a => a.ticketNumber!)
  );

  return (
    <div className="grid grid-cols-5 gap-2 p-4">
      {Array.from({ length: totalTickets }, (_, i) => i + 1).map(n => {
        const done = completedTickets.has(n);
        return (
          <button
            key={n}
            onClick={() => onSelect(n)}
            className={`aspect-square rounded-xl font-semibold text-sm flex items-center justify-center transition-all active:scale-95 ${
              done
                ? 'bg-green-100 dark:bg-green-900 text-brand-green border-2 border-brand-green/30'
                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-blue hover:text-brand-blue'
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Ticket picker page**

```tsx
// app/tickets/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import questionBank from '@/data/questions.json';
import { Header } from '@/components/Header';
import { TicketGrid } from '@/components/TicketGrid';

export default function TicketsPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Выбор билета" />
      <p className="px-4 pt-3 text-sm text-gray-500 dark:text-gray-400">
        Всего {questionBank.tickets.length} билетов · Выберите номер билета
      </p>
      <TicketGrid
        totalTickets={questionBank.tickets.length}
        onSelect={(n) => router.push(`/tickets/${n}`)}
      />
    </div>
  );
}
```

- [ ] **Step 3: Single ticket page**

```tsx
// app/tickets/[id]/page.tsx
'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import questionBank from '@/data/questions.json';
import { useExamSession } from '@/hooks/useExamSession';
import { useSettings } from '@/hooks/useSettings';
import { useStatistics } from '@/hooks/useStatistics';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { QuestionCard } from '@/components/QuestionCard';
import { ExamAttempt } from '@/types';

export default function TicketPage() {
  const router = useRouter();
  const params = useParams();
  const ticketId = Number(params.id);
  const { settings } = useSettings();
  const { addAttempt } = useStatistics();

  const ticket = questionBank.tickets.find(t => t.ticketNumber === ticketId);
  const session = useExamSession(ticket?.questions ?? []);
  const correctCount = session.answers.filter(
    (a, i) => a === (ticket?.questions[i]?.correctAnswer)
  ).length;

  if (!ticket) {
    return <div className="p-4 text-center text-gray-500">Билет не найден</div>;
  }

  const handleFinish = () => {
    const results = session.getResults();
    const attempt: ExamAttempt = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mode: 'ticket',
      ticketNumber: ticketId,
      totalQuestions: results.totalQuestions,
      correctCount: results.correctCount,
      wrongQuestionIds: results.wrongQuestionIds,
      durationSeconds: results.durationSeconds,
    };
    addAttempt(attempt);
    sessionStorage.setItem('lastAttempt', JSON.stringify(attempt));
    router.push('/results');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={`Билет №${ticketId}`}
        rightElement={
          <div className="text-sm font-semibold text-brand-blue">{correctCount}/{session.totalQuestions}</div>
        }
      />
      <ProgressBar current={session.currentIndex + 1} total={session.totalQuestions} correctCount={correctCount} />

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <QuestionCard
          question={session.currentQuestion}
          selectedAnswer={session.answers[session.currentIndex]}
          answerState={session.answerStates[session.currentIndex]}
          showImmediately={true}
          onSelectAnswer={(idx) => session.selectAnswer(idx, true)}
        />
      </div>

      <div className="px-4 pb-6 pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-3">
        <button
          onClick={session.goBack}
          disabled={session.currentIndex === 0}
          className="px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-colors"
        >
          ← Назад
        </button>
        {session.isLast ? (
          <button onClick={handleFinish} className="flex-1 bg-brand-blue text-white rounded-xl py-3.5 font-semibold text-sm">
            Завершить билет
          </button>
        ) : (
          <button
            onClick={session.goNext}
            disabled={!session.isAnswered}
            className="flex-1 bg-brand-blue text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Далее →
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/tickets/ components/TicketGrid.tsx
git commit -m "feat: add tickets mode with ticket picker and single ticket view"
```

---

## Task 8: Random Training Mode

**Files:**
- Create: `app/random/page.tsx`

- [ ] **Step 1: Random training page**

```tsx
// app/random/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import questionBank from '@/data/questions.json';
import { useExamSession } from '@/hooks/useExamSession';
import { useStatistics } from '@/hooks/useStatistics';
import { shuffle } from '@/utils/shuffle';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { QuestionCard } from '@/components/QuestionCard';
import { Question, ExamAttempt } from '@/types';

const COUNT_OPTIONS = [10, 20, 40];

export default function RandomPage() {
  const router = useRouter();
  const { addAttempt } = useStatistics();
  const [count, setCount] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const session = useExamSession(questions);

  const startSession = (n: number) => {
    const all: Question[] = questionBank.tickets.flatMap(t => t.questions);
    setQuestions(shuffle(all).slice(0, n));
    setCount(n);
  };

  const correctCount = session.answers.filter(
    (a, i) => a === questions[i]?.correctAnswer
  ).length;

  if (!count) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Случайные вопросы" />
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🎲</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Сколько вопросов?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Выберите количество вопросов для тренировки</p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {COUNT_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => startSession(n)}
                className="w-full py-4 rounded-2xl bg-brand-blue text-white font-bold text-lg hover:bg-blue-700 transition-colors active:scale-95"
              >
                {n} вопросов
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleFinish = () => {
    const results = session.getResults();
    const attempt: ExamAttempt = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mode: 'random',
      totalQuestions: results.totalQuestions,
      correctCount: results.correctCount,
      wrongQuestionIds: results.wrongQuestionIds,
      durationSeconds: results.durationSeconds,
    };
    addAttempt(attempt);
    sessionStorage.setItem('lastAttempt', JSON.stringify(attempt));
    router.push('/results');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Случайные вопросы"
        rightElement={<div className="text-sm font-semibold text-brand-blue">{correctCount}/{session.totalQuestions}</div>}
      />
      <ProgressBar current={session.currentIndex + 1} total={session.totalQuestions} correctCount={correctCount} />
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <QuestionCard
          question={session.currentQuestion}
          selectedAnswer={session.answers[session.currentIndex]}
          answerState={session.answerStates[session.currentIndex]}
          showImmediately={true}
          onSelectAnswer={(idx) => session.selectAnswer(idx, true)}
        />
      </div>
      <div className="px-4 pb-6 pt-2 border-t border-gray-100 dark:border-gray-800">
        {session.isLast ? (
          <button onClick={handleFinish} className="w-full bg-brand-blue text-white rounded-xl py-3.5 font-semibold text-sm">
            Завершить тренировку
          </button>
        ) : (
          <button
            onClick={session.goNext}
            disabled={!session.isAnswered}
            className="w-full bg-brand-blue text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-40"
          >
            Следующий →
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/random/
git commit -m "feat: add random training mode"
```

---

## Task 9: Results Screen

**Files:**
- Create: `app/results/page.tsx`, `components/ResultScreen.tsx`

- [ ] **Step 1: ResultScreen component**

```tsx
// components/ResultScreen.tsx
'use client';
import { useRouter } from 'next/navigation';
import { ExamAttempt } from '@/types';
import { getExamStatus, STATUS_MESSAGES } from '@/utils/scoring';
import { DEFAULT_SCORING } from '@/types';

interface ResultScreenProps {
  attempt: ExamAttempt;
}

export function ResultScreen({ attempt }: ResultScreenProps) {
  const router = useRouter();
  const percent = Math.round((attempt.correctCount / attempt.totalQuestions) * 100);
  const status = getExamStatus(attempt.correctCount, attempt.totalQuestions, DEFAULT_SCORING);
  const msg = STATUS_MESSAGES[status];
  const wrongCount = attempt.totalQuestions - attempt.correctCount;
  const minutes = Math.floor(attempt.durationSeconds / 60);
  const seconds = attempt.durationSeconds % 60;

  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (percent / 100) * circumference;
  const circleColor = status === 'excellent' ? '#0E9F6E' : status === 'passed' ? '#FACA15' : '#E02424';

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-6">
        {/* Score circle */}
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              stroke={circleColor} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{percent}%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{attempt.correctCount}/{attempt.totalQuestions}</span>
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          <h2 className={`text-xl font-bold ${msg.color}`}>{msg.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">{msg.subtitle}</p>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 w-full max-w-xs">
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-brand-green">{attempt.correctCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Правильно</div>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-brand-red">{wrongCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Ошибок</div>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-gray-700 dark:text-gray-200">{minutes}:{String(seconds).padStart(2, '0')}</div>
            <div className="text-xs text-gray-500 mt-0.5">Время</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {wrongCount > 0 && (
            <button
              onClick={() => router.push('/mistakes')}
              className="w-full py-3.5 rounded-xl border-2 border-brand-red text-brand-red font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              Посмотреть ошибки ({wrongCount})
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="w-full py-3.5 rounded-xl bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            Пройти заново
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Вернуться в меню
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Results page**

```tsx
// app/results/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { ExamAttempt } from '@/types';
import { ResultScreen } from '@/components/ResultScreen';

export default function ResultsPage() {
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('lastAttempt');
    if (raw) setAttempt(JSON.parse(raw));
  }, []);

  if (!attempt) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Нет данных</div>;
  }

  return <ResultScreen attempt={attempt} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add app/results/ components/ResultScreen.tsx
git commit -m "feat: add results screen with animated score circle"
```

---

## Task 10: Mistakes, Statistics, Settings Pages

**Files:**
- Create: `app/mistakes/page.tsx`, `app/statistics/page.tsx`, `app/settings/page.tsx`

- [ ] **Step 1: Mistakes page**

```tsx
// app/mistakes/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import questionBank from '@/data/questions.json';
import { useStatistics } from '@/hooks/useStatistics';
import { useExamSession } from '@/hooks/useExamSession';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { QuestionCard } from '@/components/QuestionCard';
import { Question, ExamAttempt } from '@/types';

export default function MistakesPage() {
  const router = useRouter();
  const { mistakeIds, addAttempt, clearAll } = useStatistics();
  const [practicing, setPracticing] = useState(false);

  const allQuestions: Question[] = questionBank.tickets.flatMap(t => t.questions);
  const mistakeQuestions = allQuestions.filter(q => mistakeIds.includes(q.id));

  const session = useExamSession(mistakeQuestions);
  const correctCount = session.answers.filter(
    (a, i) => a === mistakeQuestions[i]?.correctAnswer
  ).length;

  if (!practicing) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Мои ошибки" />
        {mistakeQuestions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
            <div className="text-5xl">🎉</div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Ошибок нет!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Пройдите экзамен, и здесь появятся вопросы, на которые вы ошиблись</p>
            <button onClick={() => router.push('/')} className="mt-4 px-6 py-3 bg-brand-blue text-white rounded-xl font-semibold text-sm">
              На главную
            </button>
          </div>
        ) : (
          <div className="px-4 py-4">
            <div className="bg-red-50 dark:bg-red-950 rounded-2xl p-4 mb-4">
              <div className="text-2xl font-bold text-brand-red">{mistakeQuestions.length}</div>
              <div className="text-sm text-red-700 dark:text-red-300">вопросов с ошибками</div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setPracticing(true)}
                className="w-full py-3.5 bg-brand-blue text-white rounded-xl font-semibold text-sm"
              >
                Тренироваться по ошибкам
              </button>
              <button
                onClick={clearAll}
                className="w-full py-3.5 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-semibold text-sm"
              >
                Сбросить статистику
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {mistakeQuestions.slice(0, 10).map(q => (
                <div key={q.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                  <span className="text-xs text-gray-400 mr-1">#{q.id}</span>
                  {q.question.slice(0, 80)}…
                </div>
              ))}
              {mistakeQuestions.length > 10 && (
                <p className="text-xs text-gray-400 text-center">и ещё {mistakeQuestions.length - 10} вопросов</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleFinish = () => {
    const results = session.getResults();
    const attempt: ExamAttempt = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mode: 'random',
      totalQuestions: results.totalQuestions,
      correctCount: results.correctCount,
      wrongQuestionIds: results.wrongQuestionIds,
      durationSeconds: results.durationSeconds,
    };
    addAttempt(attempt);
    sessionStorage.setItem('lastAttempt', JSON.stringify(attempt));
    router.push('/results');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Работа над ошибками" rightElement={<div className="text-sm font-semibold text-brand-blue">{correctCount}/{session.totalQuestions}</div>} />
      <ProgressBar current={session.currentIndex + 1} total={session.totalQuestions} correctCount={correctCount} />
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <QuestionCard
          question={session.currentQuestion}
          selectedAnswer={session.answers[session.currentIndex]}
          answerState={session.answerStates[session.currentIndex]}
          showImmediately={true}
          onSelectAnswer={(idx) => session.selectAnswer(idx, true)}
        />
      </div>
      <div className="px-4 pb-6 pt-2 border-t border-gray-100 dark:border-gray-800">
        {session.isLast ? (
          <button onClick={handleFinish} className="w-full bg-brand-blue text-white rounded-xl py-3.5 font-semibold text-sm">Завершить</button>
        ) : (
          <button onClick={session.goNext} disabled={!session.isAnswered} className="w-full bg-brand-blue text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-40">Далее →</button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Statistics page**

```tsx
// app/statistics/page.tsx
'use client';
import { useStatistics } from '@/hooks/useStatistics';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';

export default function StatisticsPage() {
  const { stats, attempts, clearAll } = useStatistics();

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Статистика" />
      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Попыток" value={stats.totalAttempts} color="text-brand-blue" />
          <StatCard label="Средний балл" value={`${stats.averageScore}%`} color="text-brand-green" />
          <StatCard label="Лучший результат" value={`${stats.bestScore}%`} color="text-purple-500" />
          <StatCard label="Ошибок в базе" value={stats.mistakeCount} color="text-brand-red" />
        </div>
        <StatCard label="Всего вопросов отвечено" value={stats.totalQuestions} sub={`${stats.totalCorrect} правильных`} />

        {attempts.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Последние попытки</h2>
            <div className="flex flex-col gap-2">
              {stats.recentAttempts.map(a => {
                const pct = Math.round(a.correctCount / a.totalQuestions * 100);
                const date = new Date(a.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                const modeLabel = a.mode === 'exam' ? 'Экзамен' : a.mode === 'ticket' ? `Билет №${a.ticketNumber}` : 'Тренировка';
                return (
                  <div key={a.id} className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                    <div className={`text-base font-bold ${pct >= 90 ? 'text-brand-green' : pct >= 70 ? 'text-brand-yellow' : 'text-brand-red'}`}>{pct}%</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{modeLabel}</div>
                      <div className="text-xs text-gray-400">{date}</div>
                    </div>
                    <div className="text-xs text-gray-400">{a.correctCount}/{a.totalQuestions}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={clearAll}
          className="w-full py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-red-300 hover:text-brand-red transition-colors"
        >
          Сбросить всю статистику
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Settings page**

```tsx
// app/settings/page.tsx
'use client';
import { useSettings } from '@/hooks/useSettings';
import { Header } from '@/components/Header';

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex-1">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">{label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-brand-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Настройки" />
      <div className="px-4 py-4 flex flex-col gap-3">
        <Toggle
          label="Показывать ответ сразу"
          description="Подсвечивает правильный/неправильный ответ сразу после выбора"
          checked={settings.showAnswerImmediately}
          onChange={(v) => updateSettings({ showAnswerImmediately: v })}
        />
        <Toggle
          label="Перемешивать вопросы"
          description="Случайный порядок вопросов в режиме экзамена"
          checked={settings.shuffleQuestions}
          onChange={(v) => updateSettings({ shuffleQuestions: v })}
        />
        <Toggle
          label="Звуки при ответе"
          description="Звуковой сигнал при правильном и неправильном ответе"
          checked={settings.soundEnabled}
          onChange={(v) => updateSettings({ soundEnabled: v })}
        />
        <Toggle
          label="Тёмная тема"
          description="Переключиться на тёмный интерфейс"
          checked={settings.darkMode}
          onChange={(v) => updateSettings({ darkMode: v })}
        />

        <div className="mt-2 bg-blue-50 dark:bg-blue-950 rounded-2xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          <strong>О приложении:</strong> Тренажёр экзамена ПДД России. Все вопросы соответствуют официальным билетам ГИБДД. Данные хранятся только на вашем устройстве.
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add app/mistakes/ app/statistics/ app/settings/
git commit -m "feat: add mistakes, statistics, and settings pages"
```

---

## Task 11: PWA Icons & Final Polish

**Files:**
- Modify: `app/layout.tsx`, `public/manifest.json`
- Create: `public/icons/` (placeholder SVG-based icons)

- [ ] **Step 1: Generate placeholder PWA icons**

Create simple colored PNG icons programmatically or use a tool. Quick approach — create an SVG icon and reference it:

```bash
# Create a simple placeholder icon using Canvas API in a script
# Or use any online favicon generator with the text "ПДД" on blue background
# Place results at:
# public/icons/icon-192.png
# public/icons/icon-512.png
```

For quick testing, copy any 192×192 and 512×512 PNG to `public/icons/`.

- [ ] **Step 2: Verify PWA config in next.config.js**

Make sure `next-pwa` is configured and service worker generates on `npm run build`.

- [ ] **Step 3: Final build & test**

```bash
npm run build && npm run start
# Open http://localhost:3000
# Test on mobile via ngrok or local network IP
```

- [ ] **Step 4: Commit**

```bash
git add public/
git commit -m "feat: add PWA icons and finalize app"
```

---

## Task 12: PDF-to-JSON Extraction Script (Bonus)

**Files:**
- Create: `scripts/extract-pdf.ts`

When the user provides the official PDF, run this script to generate `data/questions.json`:

- [ ] **Step 1: Install PDF parser**

```bash
npm install -D pdf-parse tsx
```

- [ ] **Step 2: Create extraction script**

```ts
// scripts/extract-pdf.ts
// Run: npx tsx scripts/extract-pdf.ts path/to/pdd.pdf
import fs from 'fs';
import pdfParse from 'pdf-parse';

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) { console.error('Usage: tsx scripts/extract-pdf.ts <pdf-path>'); process.exit(1); }

  const buffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(buffer);
  const text = data.text;

  // Write raw text for manual inspection
  fs.writeFileSync('scripts/raw-pdf.txt', text);
  console.log('Raw text written to scripts/raw-pdf.txt');
  console.log('Review the raw text and write a parser matching the PDF structure.');
  console.log('PDF page count:', data.numpages);
}

main();
```

> **Note:** After running, inspect `scripts/raw-pdf.txt` to understand the PDF's text structure, then write a dedicated parser for that specific layout. PDF parsing is layout-specific and cannot be fully automated without seeing the actual file.

- [ ] **Step 3: Commit**

```bash
git add scripts/
git commit -m "feat: add PDF extraction scaffold script"
```

---

## Running the App

```bash
cd /Users/Konstantin/Projects/pdd-exam-app
npm install
npm run dev
# Open http://localhost:3000
```

For production / iPhone testing:
```bash
npm run build && npm run start
# On same Wi-Fi: open http://<your-mac-ip>:3000 on iPhone
# Add to Home Screen via Safari → Share → Add to Home Screen
```
