import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/auth/admin';
import { createProjectAction } from '../../actions';
import ToastNotice from '../../ToastNotice';
import ProjectEditorForm from '@/components/dashboard/ProjectEditorForm';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewProjectPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('Dashboard.editor');
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/dashboard/projects/new`)}`);
  }

  if (!(await isAdminUser(authData.user.id))) {
    notFound();
  }

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-10 sm:pb-20">
      <ToastNotice />
      <div className="mb-4 sm:mb-6">
        <Link href={`/${locale}/dashboard?tab=projects`} className="text-xs font-mono text-muted-foreground hover:text-foreground">
          {t('backToDashboard')}
        </Link>
      </div>
      <div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-4 sm:mb-5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">{t('draftLabel')}</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('createTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t('createDescription')}
          </p>
        </div>
        <ProjectEditorForm
          action={createProjectAction.bind(null, locale)}
          submitLabel={t('createSubmit')}
          initialValues={{
            status: 'completed',
            is_published: true,
          }}
        />
      </div>
    </section>
  );
}
