'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Question } from '@/types';
import { AnswerButton } from './AnswerButton';
import { AnswerState } from '@/hooks/useExamSession';
import { useVoice } from '@/hooks/useVoice';

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  answerState: AnswerState;
  showImmediately: boolean;
  onSelectAnswer: (index: number) => void;
  autoVoice?: boolean;
}

export function QuestionCard({
  question,
  selectedAnswer,
  answerState,
  showImmediately,
  onSelectAnswer,
  autoVoice = false,
}: QuestionCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const { speak, stop, toggle, isPlaying } = useVoice(true);

  // Reset explanation toggle when question changes
  useEffect(() => {
    setShowExplanation(false);
  }, [question.id]);

  // Auto-voice: read question + options when question changes
  useEffect(() => {
    if (!autoVoice) {
      stop();
      return;
    }
    const optionLines = question.options
      .map((o, i) => `Вариант ${i + 1}. ${o}`)
      .join('. ');
    speak(`${question.question}. ${optionLines}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, autoVoice]);

  const getButtonState = (
    optionIndex: number
  ): 'default' | 'selected' | 'correct' | 'wrong' | 'dimmed' => {
    if (selectedAnswer === null) return 'default';

    if (showImmediately && answerState !== 'unanswered') {
      if (optionIndex === question.correctAnswer) return 'correct';
      if (optionIndex === selectedAnswer) return 'wrong';
      return 'dimmed';
    }

    if (optionIndex === selectedAnswer) return 'selected';
    return 'dimmed';
  };

  const buildVoiceText = () => {
    const optionLines = question.options
      .map((o, i) => `Вариант ${i + 1}. ${o}`)
      .join('. ');
    return `${question.question}. ${optionLines}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Question text + voice button */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-2">
          <p className="flex-1 text-base font-medium text-gray-900 dark:text-white leading-relaxed">
            {question.question}
          </p>
          <button
            onClick={() => {
              if (isPlaying) {
                toggle();
              } else {
                speak(buildVoiceText());
              }
            }}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-brand-blue transition-colors cursor-pointer"
            title={isPlaying ? 'Остановить' : 'Читать вслух'}
          >
            {isPlaying ? '⏸' : '🔊'}
          </button>
        </div>

        {question.image && (
          <div className="mt-3 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
            <Image
              src={question.image}
              alt="Иллюстрация к вопросу"
              width={480}
              height={180}
              sizes="(max-width: 640px) 100vw, 480px"
              className="w-full h-auto"
              priority={false}
            />
          </div>
        )}
      </div>

      {/* Answer options */}
      <div className="flex flex-col gap-2">
        {question.options.map((option, idx) => (
          <AnswerButton
            key={idx}
            label={option}
            index={idx}
            state={getButtonState(idx)}
            onClick={() => onSelectAnswer(idx)}
          />
        ))}
      </div>

      {/* Explain button — appears after answer selected */}
      {selectedAnswer !== null && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowExplanation(v => !v)}
            className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
          >
            💡 {showExplanation ? 'Скрыть объяснение' : 'Объяснить'}
          </button>

          {showExplanation && (
            <div className="p-3.5 rounded-xl text-sm leading-relaxed bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-100 border border-amber-200 dark:border-amber-800">
              <span className="font-semibold">💡 </span>
              {question.explanation ?? 'Объяснение недоступно.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
