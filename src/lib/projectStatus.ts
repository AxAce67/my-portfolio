// Project status badge colors, shared by the admin dashboard and the public
// cards/article header. Labels live in messages (`ProjectStatus.*`).

export const PROJECT_STATUSES = ['idea', 'design', 'development', 'running', 'completed', 'on_hold'] as const;
export type ProjectStatusValue = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(value: string | null | undefined): value is ProjectStatusValue {
  return !!value && (PROJECT_STATUSES as readonly string[]).includes(value);
}

export const PROJECT_STATUS_BADGE_CLASS: Record<ProjectStatusValue, string> = {
  idea: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/25',
  design: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25',
  development: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25',
  running: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/25',
  completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
  on_hold: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25',
};

export const PROJECT_STATUS_DOT_CLASS: Record<ProjectStatusValue, string> = {
  idea: 'bg-slate-500',
  design: 'bg-blue-500',
  development: 'bg-amber-500',
  running: 'bg-teal-500',
  completed: 'bg-emerald-500',
  on_hold: 'bg-rose-500',
};
