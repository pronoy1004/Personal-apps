'use client';

import { useEffect, useState } from 'react';
import { useKanban } from './useKanban';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const { data, updateData } = useKanban();
  const [theme, setTheme] = useState<Theme>(data?.settings.theme || 'system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (data) {
      setTheme(data.settings.theme);
    }
  }, [data]);

  useEffect(() => {
    const root = document.documentElement;
    
    const getSystemTheme = (): 'light' | 'dark' => {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    };

    const applyTheme = (newTheme: Theme) => {
      const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
      setResolvedTheme(resolved);
      
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setThemeAndSave = (newTheme: Theme) => {
    setTheme(newTheme);
    if (data) {
      updateData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          theme: newTheme,
        },
      }));
    }
  };

  return { theme, resolvedTheme, setTheme: setThemeAndSave };
}
