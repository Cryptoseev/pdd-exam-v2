interface ProgressBarProps {
  current: number;
  total: number;
  correctCount?: number;
}

export function ProgressBar({ current, total, correctCount }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);
  return (
    <div className="px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        <span className="font-medium">
          Вопрос <span className="text-gray-900 dark:text-white">{current}</span> из {total}
        </span>
        {correctCount !== undefined && (
          <span className="text-brand-green font-semibold">{correctCount} верно</span>
        )}
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-blue rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
