export interface Question {
  id: string; // "1-1" = ticket 1, question 1
  question: string;
  image?: string; // path relative to /public/images/
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
  showAnswerImmediately: boolean;
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
  date: string; // ISO timestamp
  mode: 'exam' | 'ticket' | 'random';
  ticketNumber?: number;
  totalQuestions: number;
  correctCount: number;
  wrongQuestionIds: string[];
  durationSeconds: number;
}

export type ExamStatus = 'excellent' | 'passed' | 'failed';

export interface ScoringConfig {
  excellentThreshold: number; // ratio, 1.0 = all correct
  passThreshold: number; // ratio, 0.9 = ≤2 errors in 20
}

export const DEFAULT_SCORING: ScoringConfig = {
  excellentThreshold: 1.0,
  passThreshold: 0.9,
};
