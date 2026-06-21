import { useTranslation, type UseTranslationResponse } from 'react-i18next';

type Translator = UseTranslationResponse<string, undefined>['t'];

// react-i18next's namespace argument must match a literal top-level key
// in messages/*.json (it doesn't walk dotted paths the way next-intl's
// useTranslations('Dashboard.active') does). Split off the root
// namespace ourselves and prefix every key lookup with the remainder.
export function useTranslations(namespace?: string): Translator {
  const [ns, ...rest] = namespace ? namespace.split('.') : [];
  const prefix = rest.join('.');
  const { t } = useTranslation(ns || undefined);

  if (!prefix) return t;
  return ((key: string, options?: Record<string, unknown>) => t(`${prefix}.${key}`, options)) as Translator;
}
