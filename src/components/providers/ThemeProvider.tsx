import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'dark', setTheme: (_theme: string) => {}, resolvedTheme: 'dark' });

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
};

export function ThemeProvider({ children, attribute, defaultTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || defaultTheme || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    if (attribute === 'class') {
      // already added class
    } else {
      root.setAttribute(attribute || 'data-theme', theme);
    }
    localStorage.setItem('theme', theme);
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
