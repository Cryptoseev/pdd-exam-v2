'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useVoice(enabled: boolean) {
  const [isPlaying, setIsPlaying] = useState(false);
  const lastTextRef = useRef<string>('');

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!enabled || typeof window === 'undefined') return;
      if (!window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      lastTextRef.current = text;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 0.95;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    },
    [enabled]
  );

  // iOS Safari: pause/resume is unreliable — implement as stop + restart
  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      speak(lastTextRef.current);
    }
  }, [isPlaying, speak, stop]);

  return { speak, stop, toggle, isPlaying };
}
