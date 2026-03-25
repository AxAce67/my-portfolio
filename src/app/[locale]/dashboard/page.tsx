import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/auth/admin';
import { logoutAction } from '../login/actions';
import ToastNotice from './ToastNotice';
import ActiveProjectsManager from '@/components/dashboard/ActiveProjectsManager';
import DeleteProjectButton from '@/components/dashboard/DeleteProjectButton';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; toast?: string; toastAt?: string; auditPage?: string; auditType?: string; auditOutcome?: string }>;
};

export default async function DashboardPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const t = await getTranslations('Dashboard');
  const query = await searchParams;
  const activeTab = query.tab === 'active' || query.tab === 'audit' ? query.tab : 'projects';
  const auditType = query.auditType === 'csp' ? 'csp' : 'auth';
  const auditOutcome =
    query.auditOutcome === 'success' ||
    query.auditOutcome === 'invalid_credentials' ||
    query.auditOutcome === 'rate_limited'
      ? query.auditOutcome
      : 'all';
  const auditPage = Math.max(1, Number(query.auditPage ?? '1') || 1);
  const auditPageSize = 20;
  const auditFrom = (auditPage - 1) * auditPageSize;
  const auditTo = auditFrom + auditPageSize - 1;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/dashboard`)}`);
  }

  if (!(await isAdminUser(authData.user.id))) {
    return (
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <h1 className="text-3xl font-bold tracking-tight mb-4">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('noAdmin')}</p>
      </section>
    );
  }

  // Fetch only what the active tab needs, in parallel where possible
  let projects: { id: string; title: string | null; status: string | null; is_published: boolean | null; updated_at: string | null }[] = [];
  let activeProjects: { id: string; name: string; stage: number; display_order: number; is_published: boolean; updated_at: string | null }[] = [];
  let authAuditLogs: { id: string; created_at: string; email_masked: string | null; email_input: string | null; ip_hash: string | null; ip_address: string | null; user_agent: string | null; locale: string | null; outcome: string; user_id: string | null }[] = [];
  let authAuditError: boolean = false;
  let totalAuthAuditCount = 0;
  let totalAuthSuccessCount = 0;
  let totalAuthInvalidCount = 0;
  let totalAuthRateLimitedCount = 0;
  let cspAuditLogs: { id: string; created_at: string; effective_directive: string | null; violated_directive: string | null; blocked_uri: string | null; document_uri: string | null; disposition: string | null }[] = [];
  let cspAuditError: boolean = false;
  let totalCspAuditCount = 0;

  if (activeTab === 'projects') {
    const { data } = await supabase
      .from('portfolio_projects')
      .select('id, title, status, is_published, updated_at')
      .order('updated_at', { ascending: false });
    projects = data ?? [];
  } else if (activeTab === 'active') {
    const { data } = await supabase
      .from('portfolio_active_projects')
      .select('id, name, stage, display_order, is_published, updated_at')
      .order('display_order', { ascending: true })
      .order('updated_at', { ascending: false });
    activeProjects = data ?? [];
  } else {
    // audit tab: run all queries in parallel
    let authAuditBaseQuery = supabase
      .from('auth_audit_logs')
      .select('id, created_at, email_masked, email_input, ip_hash, ip_address, user_agent, locale, outcome, user_id', { count: 'exact' });
    if (auditOutcome !== 'all') {
      authAuditBaseQuery = authAuditBaseQuery.eq('outcome', auditOutcome);
    }

    const [
      authLogsResult,
      successCountResult,
      invalidCountResult,
      rateLimitedCountResult,
      cspLogsResult,
    ] = await Promise.all([
      authAuditBaseQuery.order('created_at', { ascending: false }).range(auditFrom, auditTo),
      supabase.from('auth_audit_logs').select('*', { count: 'exact', head: true }).eq('outcome', 'success'),
      supabase.from('auth_audit_logs').select('*', { count: 'exact', head: true }).eq('outcome', 'invalid_credentials'),
      supabase.from('auth_audit_logs').select('*', { count: 'exact', head: true }).eq('outcome', 'rate_limited'),
      supabase
        .from('csp_violation_logs')
        .select('id, created_at, effective_directive, violated_directive, blocked_uri, document_uri, disposition', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(auditFrom, auditTo),
    ]);

    authAuditError = !!authLogsResult.error;
    authAuditLogs = authLogsResult.error ? [] : (authLogsResult.data ?? []);
    totalAuthAuditCount = authLogsResult.error ? 0 : (authLogsResult.count ?? 0);
    totalAuthSuccessCount = successCountResult.error ? 0 : (successCountResult.count ?? 0);
    totalAuthInvalidCount = invalidCountResult.error ? 0 : (invalidCountResult.count ?? 0);
    totalAuthRateLimitedCount = rateLimitedCountResult.error ? 0 : (rateLimitedCountResult.count ?? 0);
    cspAuditError = !!cspLogsResult.error;
    cspAuditLogs = cspLogsResult.error ? [] : (cspLogsResult.data ?? []);
    totalCspAuditCount = cspLogsResult.error ? 0 : (cspLogsResult.count ?? 0);
  }

  const totalAuthAuditPages = Math.max(1, Math.ceil(totalAuthAuditCount / auditPageSize));
  const hasPrevAuthAuditPage = auditPage > 1;
  const hasNextAuthAuditPage = auditPage < totalAuthAuditPages;
  const totalCspAuditPages = Math.max(1, Math.ceil(totalCspAuditCount / auditPageSize));
  const hasPrevCspAuditPage = auditPage > 1;
  const hasNextCspAuditPage = auditPage < totalCspAuditPages;

  const outcomeBadgeClass: Record<string, string> = {
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25',
    invalid_credentials: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25',
    rate_limited: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25',
  };
  const outcomeLabelMap: Record<string, string> = {
    success: t('audit.filterSuccess'),
    invalid_credentials: t('audit.filterInvalid'),
    rate_limited: t('audit.filterRateLimited'),
  };
  const statusKeyMap: Record<string, 'status.idea' | 'status.design' | 'status.development' | 'status.completed' | 'status.on_hold'> = {
    idea: 'status.idea',
    design: 'status.design',
    development: 'status.development',
    completed: 'status.completed',
    on_hold: 'status.on_hold',
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-10 sm:pb-16 space-y-6 sm:space-y-8">
      <ToastNotice />
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t('subtitle')}</p>
          </div>
          <form action={logoutAction.bind(null, locale)} className="w-full sm:w-auto">
            <button type="submit" className="btn-outline w-full sm:w-auto px-3 py-2 text-xs">{t('signOut')}</button>
          </form>
        </div>
        <div className="mt-5 inline-flex w-full sm:w-auto rounded-xl border border-border p-1 bg-muted">
          <Link
            href={`/${locale}/dashboard?tab=projects`}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${activeTab === 'projects' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('tabs.projects')}
          </Link>
          <Link
            href={`/${locale}/dashboard?tab=active`}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${activeTab === 'active' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('tabs.activeProjects')}
          </Link>
          <Link
            href={`/${locale}/dashboard?tab=audit`}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${activeTab === 'audit' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t('tabs.audit')}
          </Link>
        </div>
      </div>

      {activeTab === 'projects' && (
        <>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{t('projects.manageTitle')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('projects.manageDescription')}</p>
            </div>
            <Link href={`/${locale}/dashboard/projects/new`} className="btn-primary w-full sm:w-auto">{t('projects.newProject')}</Link>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
            <h2 className="text-xl font-semibold">{t('projects.listTitle')}</h2>
            <div className="space-y-2">
              {projects.map((project) => (
                <div key={project.id} className="border border-border rounded-lg px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{project.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                        {project.status && statusKeyMap[project.status] ? t(statusKeyMap[project.status]) : project.status}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                        {project.is_published ? t('publish.published') : t('publish.draft')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    <Link href={`/${locale}/projects/${project.id}`} className="btn-outline flex-1 sm:flex-none px-3 py-2 text-xs">{t('actions.read')}</Link>
                    <Link href={`/${locale}/dashboard/projects/${project.id}`} className="btn-outline flex-1 sm:flex-none px-3 py-2 text-xs">{t('actions.edit')}</Link>
                    <DeleteProjectButton locale={locale} projectId={project.id} projectTitle={project.title} />
                  </div>
                </div>
              ))}
              {projects.length === 0 && <p className="text-sm text-muted-foreground">{t('projects.empty')}</p>}
            </div>
          </div>
        </>
      )}

      {activeTab === 'active' && (
        <ActiveProjectsManager
          locale={locale}
          projects={activeProjects}
        />
      )}

      {activeTab === 'audit' && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
          <div>
            <h2 className="text-xl font-semibold">{t('audit.title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('audit.description')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-full sm:w-auto rounded-xl border border-border p-1 bg-muted">
              <Link
                href={`/${locale}/dashboard?tab=audit&auditType=auth`}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${auditType === 'auth' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('audit.authTab')}
              </Link>
              <Link
                href={`/${locale}/dashboard?tab=audit&auditType=csp`}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${auditType === 'csp' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('audit.cspTab')}
              </Link>
            </div>

            {auditType === 'auth' && !authAuditError && (
              <div className="inline-flex w-full sm:w-auto rounded-xl border border-border p-1 bg-muted">
                <Link
                  href={`/${locale}/dashboard?tab=audit&auditType=auth&auditOutcome=all&auditPage=1`}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-center text-[11px] font-mono transition-colors ${auditOutcome === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t('audit.filterAll')}
                </Link>
                <Link
                  href={`/${locale}/dashboard?tab=audit&auditType=auth&auditOutcome=success&auditPage=1`}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-center text-[11px] font-mono transition-colors ${auditOutcome === 'success' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t('audit.filterSuccess')}
                </Link>
                <Link
                  href={`/${locale}/dashboard?tab=audit&auditType=auth&auditOutcome=invalid_credentials&auditPage=1`}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-center text-[11px] font-mono transition-colors ${auditOutcome === 'invalid_credentials' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t('audit.filterInvalid')}
                </Link>
                <Link
                  href={`/${locale}/dashboard?tab=audit&auditType=auth&auditOutcome=rate_limited&auditPage=1`}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-center text-[11px] font-mono transition-colors ${auditOutcome === 'rate_limited' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t('audit.filterRateLimited')}
                </Link>
              </div>
            )}
          </div>

          {auditType === 'auth' ? (
            <>
              {authAuditError ? (
                <p className="text-sm text-muted-foreground">{t('audit.notConfigured')}</p>
              ) : authAuditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('audit.empty')}</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                      <p className="text-[10px] font-mono uppercase text-muted-foreground">{t('audit.total')}</p>
                      <p className="text-base font-semibold">{totalAuthAuditCount}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                      <p className="text-[10px] font-mono uppercase text-muted-foreground">{t('audit.filterSuccess')}</p>
                      <p className="text-base font-semibold">{totalAuthSuccessCount}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                      <p className="text-[10px] font-mono uppercase text-muted-foreground">{t('audit.filterInvalid')}</p>
                      <p className="text-base font-semibold">{totalAuthInvalidCount}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                      <p className="text-[10px] font-mono uppercase text-muted-foreground">{t('audit.filterRateLimited')}</p>
                      <p className="text-base font-semibold">{totalAuthRateLimitedCount}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {authAuditLogs.map((log) => (
                      <div key={log.id} className="border border-border rounded-lg px-3 py-3 bg-background/50">
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${outcomeBadgeClass[log.outcome] ?? 'bg-muted text-muted-foreground border border-border'}`}>
                            {outcomeLabelMap[log.outcome] ?? log.outcome}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {new Date(log.created_at).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-[11px]">
                          <p className="font-mono text-muted-foreground uppercase">{t('audit.labelEmail')}</p>
                          <p className="break-all">{log.email_input || log.email_masked}</p>
                          <p className="font-mono text-muted-foreground uppercase">{t('audit.labelIp')}</p>
                          <p className="font-mono text-muted-foreground break-all">{log.ip_address || '-'}</p>
                          <p className="font-mono text-muted-foreground uppercase">{t('audit.labelIpHash')}</p>
                          <p className="font-mono text-muted-foreground break-all">{log.ip_hash}</p>
                          {log.user_id ? (
                            <>
                              <p className="font-mono text-muted-foreground uppercase">{t('audit.labelUserId')}</p>
                              <p className="font-mono text-muted-foreground break-all">{log.user_id}</p>
                            </>
                          ) : null}
                          <p className="font-mono text-muted-foreground uppercase">{t('audit.labelLocale')}</p>
                          <p className="font-mono text-muted-foreground break-all">{log.locale}</p>
                          <p className="font-mono text-muted-foreground uppercase">{t('audit.labelUserAgent')}</p>
                          <p className="font-mono text-muted-foreground break-all">{log.user_agent}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <Link
                      href={`/${locale}/dashboard?tab=audit&auditType=auth&auditOutcome=${auditOutcome}&auditPage=${Math.max(1, auditPage - 1)}`}
                      aria-disabled={!hasPrevAuthAuditPage}
                      className={`btn-outline px-3 py-2 text-xs ${!hasPrevAuthAuditPage ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      {t('audit.prev')}
                    </Link>
                    <p className="text-xs font-mono text-muted-foreground">
                      {auditPage} / {totalAuthAuditPages}
                    </p>
                    <Link
                      href={`/${locale}/dashboard?tab=audit&auditType=auth&auditOutcome=${auditOutcome}&auditPage=${Math.min(totalAuthAuditPages, auditPage + 1)}`}
                      aria-disabled={!hasNextAuthAuditPage}
                      className={`btn-outline px-3 py-2 text-xs ${!hasNextAuthAuditPage ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      {t('audit.next')}
                    </Link>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                <p className="text-[10px] font-mono uppercase text-muted-foreground">{t('audit.cspTitle')}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('audit.cspDescription')}</p>
              </div>
              {cspAuditError ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  {t('audit.cspNotConfigured')}
                </div>
              ) : cspAuditLogs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  {t('audit.cspEmpty')}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
                      <p className="text-[10px] font-mono uppercase text-muted-foreground">{t('audit.total')}</p>
                      <p className="text-base font-semibold">{totalCspAuditCount}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mt-1">
                    {cspAuditLogs.map((log) => (
                      <div key={log.id} className="border border-border rounded-lg px-3 py-3 bg-background/50">
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase border border-border">
                            {log.effective_directive || log.violated_directive || 'csp'}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {new Date(log.created_at).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-[11px]">
                          <p className="font-mono text-muted-foreground uppercase">{t('audit.labelDirective')}</p>
                          <p className="font-mono text-muted-foreground break-all">{log.effective_directive || log.violated_directive || '-'}</p>
                          <p className="font-mono text-muted-foreground uppercase">{t('audit.labelBlocked')}</p>
                          <p className="font-mono text-muted-foreground break-all">{log.blocked_uri || '-'}</p>
                          <p className="font-mono text-muted-foreground uppercase">{t('audit.labelDocument')}</p>
                          <p className="font-mono text-muted-foreground break-all">{log.document_uri || '-'}</p>
                          <p className="font-mono text-muted-foreground uppercase">{t('audit.labelDisposition')}</p>
                          <p className="font-mono text-muted-foreground">{log.disposition || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <Link
                      href={`/${locale}/dashboard?tab=audit&auditType=csp&auditPage=${Math.max(1, auditPage - 1)}`}
                      aria-disabled={!hasPrevCspAuditPage}
                      className={`btn-outline px-3 py-2 text-xs ${!hasPrevCspAuditPage ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      {t('audit.prev')}
                    </Link>
                    <p className="text-xs font-mono text-muted-foreground">
                      {auditPage} / {totalCspAuditPages}
                    </p>
                    <Link
                      href={`/${locale}/dashboard?tab=audit&auditType=csp&auditPage=${Math.min(totalCspAuditPages, auditPage + 1)}`}
                      aria-disabled={!hasNextCspAuditPage}
                      className={`btn-outline px-3 py-2 text-xs ${!hasNextCspAuditPage ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      {t('audit.next')}
                    </Link>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
