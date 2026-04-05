export const navigationStateKeys = {
  returnToProjects: 'returnToProjects',
  homeScrollY: 'homeScrollY',
  homeFromProjectId: 'homeFromProjectId',
  projectsViewMode: 'projectsViewMode',
  projectsReferrer: 'projectsReferrer',
  projectsScrollY: 'projectsScrollY',
  languageScrollY: '__lang-switch-scroll__',
} as const;

export function readSessionValue(key: string) {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(key);
}

export function readSessionNumber(key: string) {
  const value = readSessionValue(key);
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function writeSessionValue(key: string, value: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(key, value);
}

export function removeSessionValue(key: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(key);
}
