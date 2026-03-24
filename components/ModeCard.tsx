'use client';

interface ModeCardProps {
  icon: string;
  title: string;
  description: string;
  colorClass: string;
  badge?: string;
  onClick: () => void;
}

export function ModeCard({ icon, title, description, colorClass, badge, onClick }: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all text-left active:scale-[0.98] cursor-pointer"
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${colorClass}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 dark:text-white text-sm">{title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
          {description}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {badge && (
          <span className="bg-brand-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        <svg
          className="w-4 h-4 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </button>
  );
}
