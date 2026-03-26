# Дизайн: Голос, Объяснение, Разбор ошибок

## Цель
Добавить три функции в приложение «Экзамен ПДД» для Нины Леонидовны:
1. Голосовое озвучивание вопросов
2. Кнопка «Объяснить»
3. Экран разбора ошибок после экзамена

---

## 1. 🔊 Голосовое озвучивание

### Поведение
- При открытии каждого вопроса автоматически озвучивается (если `autoVoice: true`)
- Читается: текст вопроса, затем варианты ответов по очереди
- Язык: `ru-RU`
- При переходе на следующий вопрос — текущее чтение останавливается
- Кнопка ⏸/▶ рядом с вопросом
- Когда `showAnswerImmediately: false` — озвучиваются только вопрос и варианты при открытии; после `revealAllAnswers()` ничего дополнительно не читается
- Автозвук **выключен** по умолчанию

### iOS Safari — ограничение pause/resume
`speechSynthesis.pause()` ненадёжно работает на iOS. Поэтому:
- Кнопка **⏸** → вызывает `stop()`, запоминает позицию как «остановлено»
- Кнопка **▶** → вызывает `speak()` заново с полным текстом
- Таким образом «пауза» реализована как стоп + перезапуск

### Хук `useVoice`
```ts
function useVoice(enabled: boolean): {
  speak: (text: string) => void;  // останавливает предыдущее и читает новое
  stop: () => void;
  toggle: () => void;             // стоп если играет, speak если остановлено
  isPlaying: boolean;
}
```
- Если `enabled: false` — все вызовы игнорируются
- `speak()` хранит последний текст для перезапуска через `toggle`

### Настройки
- `autoVoice: boolean` в `Settings` и `DEFAULT_SETTINGS` (default: `false`)

### Файлы
- Создать: `hooks/useVoice.ts`
- Изменить: `types/index.ts` — `autoVoice` в `Settings` и `DEFAULT_SETTINGS`
- Изменить: `components/QuestionCard.tsx` — принимать проп `autoVoice: boolean`, вызывать хук
- Изменить: `app/settings/page.tsx` — переключатель «Автозвук»
- Изменить: `app/exam/page.tsx` — добавить `useSettings()`, передать `autoVoice` в `QuestionCard`
- Изменить: `app/tickets/[id]/page.tsx` — передать `autoVoice` в `QuestionCard`
- Изменить: `app/random/page.tsx` — добавить `useSettings()`, передать `autoVoice` в `QuestionCard`
- Изменить: `app/mistakes/page.tsx` — добавить `useSettings()`, передать `autoVoice` в `QuestionCard`

---

## 2. 🧠 Кнопка «Объяснить»

### Поведение
- Существующий авто-показ `explanation` в `QuestionCard` **удаляется**
- Кнопка «💡 Объяснить» появляется после выбора ответа (в любом режиме включая `showAnswerImmediately: false`)
- Нажатие — toggle: раскрывает/сворачивает блок
- Если `explanation` пустое — «Объяснение недоступно»

### UI
- Кнопка: `bg-gray-100`, текст «💡 Объяснить»
- Блок: `bg-amber-50 dark:bg-amber-950`, текст, иконка 💡

### Файлы
- Изменить: `components/QuestionCard.tsx` — убрать авто-показ explanation, добавить кнопку-toggle

---

## 3. 📊 Экран разбора ошибок

### Данные в sessionStorage
- Ключ `lastAttemptAnswers`: `{ questionId: string; selectedAnswer: number }[]`
- Сохраняются **все** ответы (не только ошибки) — нужно чтобы показать что выбрала пользователь
- Страницы `exam`, `tickets/[id]`, `random` сохраняют этот ключ перед переходом на `/results`
- Страница `mistakes` — **не сохраняет** (явно исключена, это тренировка, не экзамен)

### Поиск вопросов на /review
- При загрузке страницы строится `Map<string, Question>` из `questions.json` за один проход:
  ```ts
  const questionMap = new Map(
    questionBank.tickets.flatMap(t => t.questions).map(q => [q.id, q])
  );
  ```
- Затем для каждого `{ questionId, selectedAnswer }` из `lastAttemptAnswers` находим вопрос за O(1)
- Показываем только ошибки (`selectedAnswer !== question.correctAnswer`)

### Поведение /review
- Если `lastAttemptAnswers` отсутствует или пуст → «Нина Леонидовна, сначала пройдите экзамен» + кнопка «На главную»
- Иначе — список карточек только с ошибками

### По каждой ошибке
- Текст вопроса
- ❌ Выбранный ответ (`options[selectedAnswer]`) — красный фон
- ✅ Правильный ответ (`options[correctAnswer]`) — зелёный фон
- Объяснение (если есть)

### Кнопки на /results (обновлённая иерархия)
- Убрать старую кнопку «Посмотреть ошибки → /mistakes»
- Добавить две кнопки:
  1. «📋 Разбор ошибок» → `/review` (показать что было неправильно)
  2. «🔁 Тренировать ошибки» → `/mistakes` (пройти снова)
- Обе видны только если `wrongCount > 0`

### Файлы
- Создать: `app/review/page.tsx` (`'use client'`)
- Изменить: `app/results/page.tsx` — заменить одну кнопку на две
- Изменить: `app/exam/page.tsx` — сохранять `lastAttemptAnswers`
- Изменить: `app/tickets/[id]/page.tsx` — сохранять `lastAttemptAnswers`
- Изменить: `app/random/page.tsx` — сохранять `lastAttemptAnswers`
- Без изменений: `app/mistakes/page.tsx` (явно исключена)

---

## Изменения в типах

```ts
// types/index.ts

interface Settings {
  showAnswerImmediately: boolean;
  shuffleQuestions: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  autoVoice: boolean; // НОВОЕ
}

const DEFAULT_SETTINGS: Settings = {
  showAnswerImmediately: true,
  shuffleQuestions: true,
  soundEnabled: false,
  darkMode: false,
  autoVoice: false, // НОВОЕ
}

// НОВЫЙ тип
interface AnswerDetail {
  questionId: string;
  selectedAnswer: number;
}
```

---

## Что НЕ входит в этот спек
- Марафон, имитация экзамена, карточки обучения — отдельный спек
- OpenAI интеграция — не нужна
- Группировка ошибок по темам — не нужна
