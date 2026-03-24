'use client';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function Header({ title, showBack = true, rightElement }: HeaderProps) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 safe-area-inset">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Назад"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 text-base font-semibold text-gray-900 dark:text-white truncate">
        {title}
      </h1>
      {rightElement}
    </header>
  );
}
