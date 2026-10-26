'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { SwitchTrack } from '@/components/ui/SwitchTrack';
import { Select } from '@/components/ui/Select';
import { ICON_BUTTON_CLASS } from '@/components/dashboard/adminUi';
import { ImageOff, Eye, Plus, Search } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { listAdminProjects, setProjectPublished, type AdminProjectSummary, type ProjectStatus } from '@/lib/content/adminContent';
import { formatRelativeTime } from '@/lib/dates';
import DeleteProjectButton from '@/components/dashboard/DeleteProjectButton';
import { PROJECT_STATUSES, PROJECT_STATUS_BADGE_CLASS } from '@/lib/projectStatus';
import ActiveProjectsManager from '@/components/dashboard/ActiveProjectsManager';
import ProfileSettings from '@/components/dashboard/ProfileSettings';
import MutualLinksManager from '@/components/dashboard/MutualLinksManager';

const statusBadgeClass: Record<ProjectStatus, string> = PROJECT_STATUS_BADGE_CLASS;

const statusFilterOptions: ProjectStatus[] = [...PROJECT_STATUSES];

type DashboardPageProps = {
  onSignOut: () => void;
};

export default function DashboardPage({ onSignOut }: DashboardPageProps) {
  const t = useTranslations('Dashboard');
  const tStatus = useTranslations('ProjectStatus');
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

  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function togglePublished(project: AdminProjectSummary) {
    const next = !project.is_published;
    setTogglingId(project.id);
    // Flip it in the list right away; roll back if the save fails.
    setProjects((current) => current.map((item) => (item.id === project.id ? { ...item, is_published: next } : item)));
    try {
      await setProjectPublished(project.id, next);
      toast.success(next ? t('projects.publishedToast') : t('projects.unpublishedToast'));
    } catch {
      setProjects((current) => current.map((item) => (item.id === project.id ? { ...item, is_published: !next } : item)));
      toast.error(t('projects.publishFailed'));
    } finally {
      setTogglingId(null);
    }
  }

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
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${activeTab === 'projects' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('tabs.projects')}
          </button>
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${activeTab === 'active' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('tabs.activeProjects')}
          </button>
          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${activeTab === 'profile' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('tabs.profile')}
          </button>
          <button
            type="button"
            onClick={() => setTab('links')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${activeTab === 'links' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
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
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ProjectStatus | 'all')}
                wrapperClassName="w-full sm:w-auto"
                className="bg-transparent border border-border rounded-lg pl-3 py-1.5 text-xs"
              >
                <option value="all">{t('projects.filterAll')}</option>
                {statusFilterOptions.map((status) => (
                  <option key={status} value={status}>
                    {tStatus(status)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              {loading &&
                [0, 1, 2].map((key) => (
                  <div key={key} className="border border-border rounded-lg px-3 py-3 flex items-center gap-3 animate-pulse">
                    <div className="w-16 h-9 rounded-sm bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-1/2 rounded-sm bg-muted" />
                      <div className="h-3 w-1/3 rounded-sm bg-muted" />
                    </div>
                  </div>
                ))}
              {!loading &&
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group border border-border rounded-lg px-3 py-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-colors hover:border-border-hover hover:bg-muted/30"
                  >
                    {/* The whole left side opens the editor. */}
                    <TransitionLink href={`/${locale}/admin/projects/${project.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                      {project.thumbnail_url ? (
                        <img src={project.thumbnail_url} alt="" className="w-16 h-9 rounded-sm object-cover border border-border shrink-0" />
                      ) : (
                        <div className="w-16 h-9 rounded-sm border border-border bg-muted flex items-center justify-center shrink-0">
                          <ImageOff className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:underline underline-offset-4">{project.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${statusBadgeClass[project.status]}`}>
                            {tStatus(project.status)}
                          </span>
                          {project.kind === 'service' && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25">
                              {t('projects.kindService')}
                            </span>
                          )}
                          {project.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                          <span className="text-[10px] text-muted-foreground">
                            {t('projects.updated', { when: formatRelativeTime(project.updated_at, locale) })}
                          </span>
                        </div>
                      </div>
                    </TransitionLink>
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={project.is_published}
                        disabled={togglingId === project.id}
                        onClick={() => togglePublished(project)}
                        className="mr-auto sm:mr-1 inline-flex items-center gap-2 text-xs text-muted-foreground disabled:opacity-60"
                      >
                        <SwitchTrack on={project.is_published} size="sm" />
                        {project.is_published ? t('publish.published') : t('publish.draft')}
                      </button>
                      <TransitionLink
                        href={project.is_published ? `/${locale}/projects/${project.id}` : `/${locale}/admin/projects/${project.id}/preview`}
                        title={project.is_published ? t('actions.read') : t('projects.preview')}
                        aria-label={project.is_published ? t('actions.read') : t('projects.preview')}
                        className={ICON_BUTTON_CLASS}
                      >
                        <Eye className="w-3.5 h-3.5" />
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
