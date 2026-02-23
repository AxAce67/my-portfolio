import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/auth/admin';
import { updateProjectAction } from '../../actions';
import ToastNotice from '../../ToastNotice';
import ProjectEditorForm from '@/components/dashboard/ProjectEditorForm';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function ProjectEditorPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations('Dashboard.editor');
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect(`/${locale}/login?next=${encodeURIComponent(`/${locale}/dashboard/projects/${id}`)}`);
  }

  if (!(await isAdminUser(authData.user.id))) {
    notFound();
  }

  const { data: project } = await supabase
    .from('portfolio_projects')
    .select('id, title, description, content_md, content_json, status, is_published, thumbnail_url')
    .eq('id', id)
    .eq('user_id', authData.user.id)
    .single();

  if (!project) notFound();

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-10 sm:pb-20">
      <ToastNotice />
      <div className="mb-4 sm:mb-5">
        <Link href={`/${locale}/dashboard?tab=projects`} className="text-xs font-mono text-muted-foreground hover:text-foreground">
          {t('backToDashboard')}
        </Link>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-6">{t('editTitle')}</h1>
      <ProjectEditorForm
        action={updateProjectAction.bind(null, locale, project.id)}
        submitLabel={t('saveChanges')}
        initialValues={{
          title: project.title ?? '',
          description: project.description ?? '',
          content_md: project.content_md ?? '',
          content_json: project.content_json ?? null,
          status: project.status ?? 'idea',
          is_published: project.is_published ?? false,
          thumbnail_url: project.thumbnail_url ?? null,
        }}
      />
    </section>
  );
}
