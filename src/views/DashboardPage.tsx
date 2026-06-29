'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ImageOff, Eye, Pencil, Plus, Search } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { listAdminProjects, type AdminProjectSummary, type ProjectStatus } from '@/lib/content/adminContent';
import DeleteProjectButton from '@/components/dashboard/DeleteProjectButton';
import ActiveProjectsManager from '@/components/dashboard/ActiveProjectsManager';
import ProfileSettings from '@/components/dashboard/ProfileSettings';
import MutualLinksManager from '@/components/dashboard/MutualLinksManager';

const statusKeyMap: Record<ProjectStatus, string> = {
  idea: 'status.idea',
  design: 'status.design',
  development: 'status.development',
  completed: 'status.completed',
  on_hold: 'status.on_hold',
};

const statusBadgeClass: Record<ProjectStatus, string> = {
  idea: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/25',
  design: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25',
  development: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25',
  completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
  on_hold: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25',
};

const statusFilterOptions: ProjectStatus[] = ['idea', 'design', 'development', 'completed', 'on_hold'];

type DashboardPageProps = {
  onSignOut: () => void;
};

export default function DashboardPage({ onSignOut }: DashboardPageProps) {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const tabParam = searchParams?.get('tab');
  const activeTab =
    tabParam === 'active' ? 'active' : tabParam === 'profile' ? 'profile' : tabParam === 'links' ? 'links' : 'projects';

  const [projects, setProjects] = useState<AdminProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  const setTab = useCallback((tab: string) => {
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  }, [pathname, router]);

  const loadProjects = useCallback(() => {
    setLoading(true);
    listAdminProjects()
      .then(setProjects)
      .catch(() => toast.error(t('projects.empty')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    if (activeTab === 'projects') loadProjects();
  }, [activeTab, loadProjects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (statusFilter !== 'all' && project.status !== statusFilter) return false;
      if (query && !project.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [projects, search, statusFilter]);

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-10 sm:pb-16 space-y-6 sm:space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t('subtitle')}</p>
          </div>
          <button type="button" onClick={onSignOut} className="btn-outline w-full sm:w-auto px-3 py-2 text-xs">
            {t('signOut')}
          </button>
        </div>
        <div className="mt-5 inline-flex w-full sm:w-auto rounded-xl border border-border p-1 bg-muted">
          <button
            type="button"
            onClick={() => setTab('projects')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${activeTab === 'projects' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('tabs.projects')}
          </button>
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${activeTab === 'active' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('tabs.activeProjects')}
          </button>
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${activeTab === 'profile' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('tabs.profile')}
          </button>
          <button
            type="button"
            onClick={() => setTab('links')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${activeTab === 'links' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('tabs.mutualLinks')}
          </button>
        </div>
      </div>

      {activeTab === 'projects' && (
        <>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{t('projects.manageTitle')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('projects.manageDescription')}</p>
            </div>
            <TransitionLink href={`/${locale}/admin/projects/new`} className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" />
              {t('projects.newProject')}
            </TransitionLink>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-semibold flex-1">{t('projects.listTitle')}</h2>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('projects.searchPlaceholder')}
                  className="w-full bg-transparent border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ProjectStatus | 'all')}
                className="w-full sm:w-auto bg-transparent border border-border rounded-lg px-3 py-1.5 text-xs"
              >
                <option value="all">{t('projects.filterAll')}</option>
                {statusFilterOptions.map((status) => (
                  <option key={status} value={status}>
                    {t(statusKeyMap[status] as 'status.idea')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {!loading &&
                filteredProjects.map((project) => (
                  <div key={project.id} className="border border-border rounded-lg px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {project.thumbnail_url ? (
                        <img src={project.thumbnail_url} alt="" className="w-14 h-8 rounded object-cover border border-border flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-8 rounded border border-border bg-muted flex items-center justify-center flex-shrink-0">
                          <ImageOff className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{project.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${statusBadgeClass[project.status]}`}>
                            {t(statusKeyMap[project.status] as 'status.idea')}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                            {project.is_published ? t('publish.published') : t('publish.draft')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                      <TransitionLink
                        href={`/${locale}/projects/${project.id}`}
                        title={t('actions.read')}
                        aria-label={t('actions.read')}
                        className="btn-outline flex-1 sm:flex-none px-3 py-2 text-xs inline-flex items-center justify-center"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </TransitionLink>
                      <TransitionLink
                        href={`/${locale}/admin/projects/${project.id}`}
                        title={t('actions.edit')}
                        aria-label={t('actions.edit')}
                        className="btn-outline flex-1 sm:flex-none px-3 py-2 text-xs inline-flex items-center justify-center"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </TransitionLink>
                      <DeleteProjectButton
                        projectId={project.id}
                        projectTitle={project.title}
                        onDeleted={() => {
                          toast.success(t('toast.project_deleted'));
                          loadProjects();
                        }}
                      />
                    </div>
                  </div>
                ))}
              {!loading && projects.length === 0 && <p className="text-sm text-muted-foreground">{t('projects.empty')}</p>}
              {!loading && projects.length > 0 && filteredProjects.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('projects.noResults')}</p>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'active' && <ActiveProjectsManager />}
      {activeTab === 'profile' && <ProfileSettings />}
      {activeTab === 'links' && <MutualLinksManager />}
    </section>
  );
}
