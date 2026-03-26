'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import questionBank from '@/data/questions.json';
import { Header } from '@/components/Header';
import { AnswerDetail, Question } from '@/types';

interface WrongItem {
  question: Question;
  selectedAnswer: number;
}

export default function ReviewPage() {
  const router = useRouter();
  const [items, setItems] = useState<WrongItem[] | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('lastAttemptAnswers');
    if (!raw) {
      setItems([]);
      return;
    }
    const details: AnswerDetail[] = JSON.parse(raw);

    // Build O(1) lookup map
    const questionMap = new Map<string, Question>(
      questionBank.tickets.flatMap(t => t.questions).map(q => [q.id, q])
    );

    const wrong: WrongItem[] = details
      .filter(d => d.selectedAnswer !== -1)
      .map(d => ({ question: questionMap.get(d.questionId)!, selectedAnswer: d.selectedAnswer }))
      .filter(item => item.question && item.selectedAnswer !== item.question.correctAnswer);

    setItems(wrong);
  }, []);

  if (items === null) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Загружаем…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--bg)]">
        <Header title="Разбор ошибок" />
        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-4 text-center">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Нина Леонидовна, ошибок нет!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            Сначала пройдите экзамен или тренировку — здесь появится разбор ошибок
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-3.5 bg-brand-blue text-white rounded-2xl font-semibold text-sm cursor-pointer"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg)]">
      <Header title={`Разбор ошибок (${items.length})`} />

      <div className="px-4 py-4 flex flex-col gap-5">
        {items.map(({ question, selectedAnswer }) => (
          <div
            key={question.id}
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700"
          >
            {/* Question */}
            <div className="px-4 pt-4 pb-3">
              <span className="text-xs font-mono text-gray-400 mb-1 block">#{question.id}</span>
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                {question.question}
              </p>
              {question.image && (
                <div className="mt-3 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                  <Image
                    src={question.image}
                    alt="Иллюстрация к вопросу"
                    width={480}
                    height={180}
                    sizes="(max-width: 640px) 100vw, 480px"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>

            {/* Wrong answer */}
            <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800">
              <span className="text-xs font-semibold text-red-500 dark:text-red-400 block mb-0.5">
                ❌ Ваш ответ
              </span>
              <span className="text-sm text-red-800 dark:text-red-200">
                {question.options[selectedAnswer] ?? '—'}
              </span>
            </div>

            {/* Correct answer */}
            <div className="mx-4 mb-3 px-3 py-2.5 rounded-xl bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800">
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 block mb-0.5">
                ✅ Правильный ответ
              </span>
              <span className="text-sm text-green-800 dark:text-green-200">
                {question.options[question.correctAnswer]}
              </span>
            </div>

            {/* Explanation */}
            {question.explanation && (
              <div className="mx-4 mb-4 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block mb-0.5">
                  💡 Объяснение
                </span>
                <span className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                  {question.explanation}
                </span>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={() => router.push('/')}
          className="w-full py-4 rounded-2xl bg-brand-blue text-white font-semibold text-sm hover:bg-blue-700 transition-colors cursor-pointer mb-4"
        >
          На главную
        </button>
      </div>
    </div>
  );
}
