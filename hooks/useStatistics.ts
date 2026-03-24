'use client';
import { useState, useEffect } from 'react';
import { ExamAttempt } from '@/types';
import { storage } from '@/utils/storage';

export interface Statistics {
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  totalQuestions: number;
  totalCorrect: number;
  recentAttempts: ExamAttempt[];
  mistakeCount: number;
}

export function useStatistics() {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [mistakeIds, setMistakeIds] = useState<string[]>([]);

  useEffect(() => {
    setAttempts(storage.getAttempts());
    setMistakeIds(storage.getMistakeIds());
  }, []);

  const stats: Statistics = {
    totalAttempts: attempts.length,
    averageScore: attempts.length
      ? Math.round(
          (attempts.reduce((s, a) => s + a.correctCount / a.totalQuestions, 0) /
            attempts.length) *
            100
        )
      : 0,
    bestScore: attempts.length
      ? Math.max(
          ...attempts.map(a => Math.round((a.correctCount / a.totalQuestions) * 100))
        )
      : 0,
    totalQuestions: attempts.reduce((s, a) => s + a.totalQuestions, 0),
    totalCorrect: attempts.reduce((s, a) => s + a.correctCount, 0),
    recentAttempts: attempts.slice(0, 5),
    mistakeCount: mistakeIds.length,
  };

  const addAttempt = (attempt: ExamAttempt) => {
    storage.addAttempt(attempt);
    storage.addMistakeIds(attempt.wrongQuestionIds);
    setAttempts(storage.getAttempts());
    setMistakeIds(storage.getMistakeIds());
  };

  const clearAll = () => {
    storage.clearAll();
    setAttempts([]);
    setMistakeIds([]);
  };

  return { stats, attempts, mistakeIds, addAttempt, clearAll };
}
