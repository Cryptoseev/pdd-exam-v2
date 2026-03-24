'use client';

interface AnswerButtonProps {
  label: string;
  index: number;
  state: 'default' | 'selected' | 'correct' | 'wrong' | 'dimmed';
  onClick: () => void;
}

const LETTERS = ['А', 'Б', 'В', 'Г', 'Д'];

export function AnswerButton({ label, index, state, onClick }: AnswerButtonProps) {
  const isDisabled = state !== 'default';

  const containerClass = {
    default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-brand-blue hover:bg-blue-50 dark:hover:bg-blue-950 active:scale-[0.98]',
    selected: 'bg-blue-50 dark:bg-blue-950 border-brand-blue',
    correct: 'bg-green-50 dark:bg-green-950 border-brand-green',
    wrong: 'bg-red-50 dark:bg-red-950 border-brand-red',
    dimmed: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50',
  }[state];

  const textClass = {
    default: 'text-gray-900 dark:text-white',
    selected: 'text-brand-blue',
    correct: 'text-brand-green',
    wrong: 'text-brand-red',
    dimmed: 'text-gray-500 dark:text-gray-400',
  }[state];

  const badgeClass = {
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    selected: 'bg-brand-blue/15 text-brand-blue',
    correct: 'bg-brand-green/15 text-brand-green',
    wrong: 'bg-brand-red/15 text-brand-red',
    dimmed: 'bg-gray-100 dark:bg-gray-700 text-gray-400',
  }[state];

  const icon = state === 'correct' ? '✓' : state === 'wrong' ? '✗' : LETTERS[index];

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-150 cursor-pointer disabled:cursor-default ${containerClass}`}
    >
      <span
        className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${badgeClass}`}
      >
        {icon}
      </span>
      <span className={`text-sm font-medium leading-snug pt-0.5 ${textClass}`}>
        {label}
      </span>
    </button>
  );
}
