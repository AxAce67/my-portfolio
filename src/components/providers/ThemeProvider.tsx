'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'dark', setTheme: (_theme: string) => {}, resolvedTheme: 'dark' });

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
};

export function ThemeProvider({ children, attribute, defaultTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return defaultTheme || 'dark';
    const stored = window.localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    const rootTheme = document.documentElement.classList.contains('light')
      ? 'light'
      : document.documentElement.classList.contains('dark')
        ? 'dark'
        : null;
    return rootTheme || defaultTheme || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    if (attribute === 'class') {
      // already added class
    } else {
      root.setAttribute(attribute || 'data-theme', theme);
    }
    window.localStorage.setItem('theme', theme);
    document.cookie = `theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [theme, attribute]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme: theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
