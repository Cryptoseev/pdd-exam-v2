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
    set(KEYS.ATTEMPTS, [a, ...attempts].slice(0, 100));
  },

  getMistakeIds: (): string[] => get(KEYS.MISTAKES, []),
  addMistakeIds: (ids: string[]) => {
    const existing = new Set(get<string[]>(KEYS.MISTAKES, []));
    ids.forEach(id => existing.add(id));
    set(KEYS.MISTAKES, Array.from(existing));
  },

  getScoringConfig: (): ScoringConfig => get(KEYS.SCORING, DEFAULT_SCORING),

  clearAll: () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};
