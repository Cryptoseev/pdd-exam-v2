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

export const STATUS_MESSAGES: Record<
  ExamStatus,
  { title: string; subtitle: string; colorClass: string; bgClass: string }
> = {
  excellent: {
    title: 'Отлично! Экзамен сдан!',
    subtitle: 'Вы ответили на все вопросы правильно. Удачи на настоящем экзамене!',
    colorClass: 'text-brand-green',
    bgClass: 'bg-green-50',
  },
  passed: {
    title: 'Экзамен почти сдан',
    subtitle: 'Есть небольшие ошибки. Изучите допущенные ошибки и повторите.',
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-50',
  },
  failed: {
    title: 'Экзамен не сдан',
    subtitle: 'Слишком много ошибок. Рекомендуется пройти тренировку ещё раз.',
    colorClass: 'text-brand-red',
    bgClass: 'bg-red-50',
  },
};
