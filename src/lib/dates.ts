export function toIsoCalendarDate(value: string | null | undefined) {
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

export function formatLocaleDate(value: string | null | undefined, locale: 'ja' | 'en') {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
