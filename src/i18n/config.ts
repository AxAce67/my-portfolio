import i18n, { createInstance, type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import type { AppLocale } from '@/i18n/locales';

import en from '../../messages/en.json';
import ja from '../../messages/ja.json';
import zhCn from '../../messages/zh-cn.json';
import zhTw from '../../messages/zh-tw.json';
import ko from '../../messages/ko.json';
import es from '../../messages/es.json';
import fr from '../../messages/fr.json';
import pt from '../../messages/pt.json';

// i18next's internal lookup hierarchy (i18n.languages) normalizes region
// subtags to BCP-47 casing (zh-cn -> zh-CN) even with cleanCode set, so the
// resource store needs both the lowercase form (matches our AppLocale/URL
// segments) and the normalized form (what lookups actually resolve to).
type MessageBundle = Resource[string];

export const resources: Resource = {
  en: { ...en } as unknown as MessageBundle,
  ja: { ...ja } as unknown as MessageBundle,
  'zh-cn': { ...zhCn } as unknown as MessageBundle,
  'zh-CN': { ...zhCn } as unknown as MessageBundle,
  'zh-tw': { ...zhTw } as unknown as MessageBundle,
  'zh-TW': { ...zhTw } as unknown as MessageBundle,
  ko: { ...ko } as unknown as MessageBundle,
  es: { ...es } as unknown as MessageBundle,
  fr: { ...fr } as unknown as MessageBundle,
  pt: { ...pt } as unknown as MessageBundle,
};

export const i18nOptions = {
  resources,
  fallbackLng: 'en',
  // Keep i18n.language lowercase (zh-cn, zh-tw) so it matches our
  // AppLocale/URL segments — the resource store above covers both casings
  // since i18next's internal lookup hierarchy still normalizes region
  // subtags regardless of this setting.
  cleanCode: true,
  interpolation: {
    escapeValue: false,
    // messages/*.json use next-intl-style single-brace placeholders
    // ({title}) — i18next defaults to {{title}}, so override to match.
    prefix: '{',
    suffix: '}',
  },
} as const;

export function createLocaleI18n(locale: AppLocale) {
  const instance = createInstance();
  instance.use(initReactI18next).init({
    ...i18nOptions,
    lng: locale,
    initAsync: false,
  });
  return instance;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(i18nOptions);

export default i18n;
