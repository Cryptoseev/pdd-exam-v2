'use client';
import { useStatistics } from '@/hooks/useStatistics';

interface TicketGridProps {
  totalTickets: number;
  onSelect: (ticketNumber: number) => void;
}

export function TicketGrid({ totalTickets, onSelect }: TicketGridProps) {
  const { attempts } = useStatistics();
  const completedTickets = new Set(
    attempts
      .filter(a => a.mode === 'ticket' && a.ticketNumber)
      .map(a => a.ticketNumber!)
  );

  return (
    <div className="grid grid-cols-5 gap-2 p-4">
      {Array.from({ length: totalTickets }, (_, i) => i + 1).map(n => {
        const done = completedTickets.has(n);
        return (
          <button
            key={n}
            onClick={() => onSelect(n)}
            className={`aspect-square rounded-xl font-semibold text-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
              done
                ? 'bg-green-50 dark:bg-green-950 text-brand-green border-2 border-brand-green/40'
                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-brand-blue hover:text-brand-blue'
            }`}
          >
            {done ? '✓' : n}
          </button>
        );
      })}
    </div>
  );
}
