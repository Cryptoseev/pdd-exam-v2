'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import questionBank from '@/data/questions.json';
import { useExamSession } from '@/hooks/useExamSession';
import { useStatistics } from '@/hooks/useStatistics';
import { Header } from '@/components/Header';
import { ProgressBar } from '@/components/ProgressBar';
import { QuestionCard } from '@/components/QuestionCard';
import { ExamAttempt } from '@/types';

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ticketId = Number(id);
  const router = useRouter();
  const { addAttempt } = useStatistics();

  const ticket = questionBank.tickets.find(t => t.ticketNumber === ticketId);
  const session = useExamSession(ticket?.questions ?? []);

  const correctCount = session.answers.filter(
    (a, i) => a === ticket?.questions[i]?.correctAnswer
  ).length;

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Билет не найден
      </div>
    );
  }

  const handleFinish = () => {
    const results = session.getResults();
    const attempt: ExamAttempt = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mode: 'ticket',
      ticketNumber: ticketId,
      totalQuestions: results.totalQuestions,
      correctCount: results.correctCount,
      wrongQuestionIds: results.wrongQuestionIds,
      durationSeconds: results.durationSeconds,
    };
    addAttempt(attempt);
    sessionStorage.setItem('lastAttempt', JSON.stringify(attempt));
    router.push('/results');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <Header
        title={`Билет №${ticketId}`}
        rightElement={
          <div className="flex items-center gap-1.5 bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue rounded-full px-3 py-1 text-sm font-bold">
            {correctCount}/{session.totalQuestions}
          </div>
        }
      />
      <ProgressBar
        current={session.currentIndex + 1}
        total={session.totalQuestions}
        correctCount={correctCount}
      />

      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <QuestionCard
          question={session.currentQuestion}
          selectedAnswer={session.answers[session.currentIndex]}
          answerState={session.answerStates[session.currentIndex]}
          showImmediately={true}
          onSelectAnswer={idx => session.selectAnswer(idx, true)}
        />
      </div>

      <div className="px-4 pb-6 pt-3 border-t border-gray-100 dark:border-gray-800 bg-[var(--bg)] flex gap-3">
        <button
          onClick={session.goBack}
          disabled={session.currentIndex === 0}
          className="px-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-colors hover:border-gray-300 cursor-pointer"
        >
          ← Назад
        </button>
        {session.isLast ? (
          <button
            onClick={handleFinish}
            className="flex-1 bg-brand-blue text-white rounded-2xl py-4 font-semibold text-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Завершить билет
          </button>
        ) : (
          <button
            onClick={session.goNext}
            disabled={!session.isAnswered}
            className="flex-1 bg-brand-blue text-white rounded-2xl py-4 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Далее →
          </button>
        )}
      </div>
    </div>
  );
}
