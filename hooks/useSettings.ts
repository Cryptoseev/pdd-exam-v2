'use client';
import { useState, useEffect } from 'react';
import { Settings, DEFAULT_SETTINGS } from '@/types';
import { storage } from '@/utils/storage';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(storage.getSettings());
  }, []);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    storage.saveSettings(next);
  };

  return { settings, updateSettings };
}
