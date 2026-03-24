'use client';
import { useRouter } from 'next/navigation';
import questionBank from '@/data/questions.json';
import { Header } from '@/components/Header';
import { TicketGrid } from '@/components/TicketGrid';

export default function TicketsPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <Header title="Тренировка по билетам" />
      <div className="px-4 pt-3 pb-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Всего {questionBank.tickets.length} билетов · Зелёные — уже пройдены
        </p>
      </div>
      <TicketGrid
        totalTickets={questionBank.tickets.length}
        onSelect={n => router.push(`/tickets/${n}`)}
      />
    </div>
  );
}
