import { getLocaleMeta } from '@/i18n/routing';

function toIsoCalendarDate(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function areSameCalendarDate(left: string | null | undefined, right: string | null | undefined) {
  const leftDate = toIsoCalendarDate(left);
  const rightDate = toIsoCalendarDate(right);

  if (!leftDate || !rightDate) {
    return false;
  }

  return leftDate === rightDate;
}

export function formatLocaleDate(value: string | null | undefined, locale: string) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(getLocaleMeta(locale).dateLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// "3 minutes ago" / "3分前" style text for recent dates (admin lists).
export function formatRelativeTime(value: string | null | undefined, locale: string, now = Date.now()): string {
  if (!value) return '';
  const diffSeconds = Math.round((new Date(value).getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60],
  ];
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) return format.format(Math.round(diffSeconds / seconds), unit);
  }
  return format.format(0, 'minute');
}
