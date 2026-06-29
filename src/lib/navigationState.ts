export const navigationStateKeys = {
  returnToProjects: 'returnToProjects',
  homeScrollY: 'homeScrollY',
  homeFromProjectId: 'homeFromProjectId',
  homeReferrerHash: 'homeReferrerHash',
  projectsViewMode: 'projectsViewMode',
  projectsReferrer: 'projectsReferrer',
  projectsScrollY: 'projectsScrollY',
  languageScrollY: '__lang-switch-scroll__',
  navTargetSection: 'navTargetSection',
} as const;

export function readSessionValue(key: string) {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readSessionNumber(key: string) {
  const value = readSessionValue(key);
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function writeSessionValue(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage unavailable (Firefox strict tracking protection, sandboxed iframe)
  }
}

export function removeSessionValue(key: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function clearProjectReturnState() {
  removeSessionValue(navigationStateKeys.returnToProjects);
  removeSessionValue(navigationStateKeys.homeScrollY);
  removeSessionValue(navigationStateKeys.homeFromProjectId);
  removeSessionValue(navigationStateKeys.projectsReferrer);
  removeSessionValue(navigationStateKeys.projectsScrollY);
}
