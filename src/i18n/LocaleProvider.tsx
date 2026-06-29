'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createLocaleI18n } from '@/i18n/config';
import { defaultLocale, type AppLocale } from '@/i18n/locales';

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
});

type Props = {
  children: ReactNode;
  initialLocale: AppLocale;
};

export function LocaleProvider({ children, initialLocale }: Props) {
  const [i18n] = useState(() => createLocaleI18n(initialLocale));
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  const setLocale = useCallback(
    (nextLocale: AppLocale) => {
      setLocaleState(nextLocale);
      document.documentElement.lang = nextLocale;
      if (i18n.language !== nextLocale) {
        void i18n.changeLanguage(nextLocale);
      }
    },
    [i18n],
  );

  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale, setLocale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </LocaleContext.Provider>
  );
}

export function useAppLocale() {
  return useContext(LocaleContext).locale;
}

export function useSetAppLocale() {
  return useContext(LocaleContext).setLocale;
}
