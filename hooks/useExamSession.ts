'use client';
import { useState, useCallback, useRef } from 'react';
import { Question } from '@/types';

export type AnswerState = 'unanswered' | 'correct' | 'wrong';

interface SessionState {
  questions: Question[];
  currentIndex: number;
  answers: (number | null)[];
  answerStates: AnswerState[];
}

export function useExamSession(questions: Question[]) {
  const startTime = useRef(Date.now());
  const [state, setState] = useState<SessionState>({
    questions,
    currentIndex: 0,
    answers: new Array(questions.length).fill(null),
    answerStates: new Array(questions.length).fill('unanswered'),
  });

  const currentQuestion = state.questions[state.currentIndex];
  const isLast = state.currentIndex === state.questions.length - 1;
  const isAnswered = state.answers[state.currentIndex] !== null;

  const selectAnswer = useCallback((optionIndex: number, showImmediately: boolean) => {
    setState(prev => {
      if (prev.answers[prev.currentIndex] !== null) return prev;
      const correct = prev.questions[prev.currentIndex].correctAnswer === optionIndex;
      const newAnswers = [...prev.answers];
      const newStates = [...prev.answerStates];
      newAnswers[prev.currentIndex] = optionIndex;
      if (showImmediately) {
        newStates[prev.currentIndex] = correct ? 'correct' : 'wrong';
      }
      return { ...prev, answers: newAnswers, answerStates: newStates };
    });
  }, []);

  const revealAllAnswers = useCallback(() => {
    setState(prev => ({
      ...prev,
      answerStates: prev.answers.map((ans, i) =>
        ans === null
          ? 'unanswered'
          : ans === prev.questions[i].correctAnswer
          ? 'correct'
          : 'wrong'
      ),
    }));
  }, []);

  const goNext = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.questions.length - 1),
    }));
  }, []);

  const goBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
    }));
  }, []);

  const getResults = useCallback(() => {
    const correctCount = state.answers.filter(
      (ans, i) => ans === state.questions[i].correctAnswer
    ).length;
    const wrongQuestionIds = state.questions
      .filter((q, i) => state.answers[i] !== null && state.answers[i] !== q.correctAnswer)
      .map(q => q.id);
    const durationSeconds = Math.round((Date.now() - startTime.current) / 1000);
    return {
      correctCount,
      wrongQuestionIds,
      durationSeconds,
      totalQuestions: state.questions.length,
    };
  }, [state]);

  return {
    currentQuestion,
    currentIndex: state.currentIndex,
    totalQuestions: state.questions.length,
    isLast,
    isAnswered,
    answers: state.answers,
    answerStates: state.answerStates,
    selectAnswer,
    revealAllAnswers,
    goNext,
    goBack,
    getResults,
  };
}
