import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { TransitionLink } from '@/components/ui/TransitionLink';
import ProjectEditorForm from '@/components/dashboard/ProjectEditorForm';
import { getAdminProjectById, updateProject, type AdminProjectDetail, type ProjectInput } from '@/lib/content/adminContent';

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('Dashboard.editor');
  const tForm = useTranslations('Dashboard.editorForm');
  const tToast = useTranslations('Dashboard.toast');
  const locale = useLocale();
  const navigate = useNavigate();

  const [project, setProject] = useState<AdminProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!id) return;
    getAdminProjectById(id).then((data) => {
      if (!data) {
        navigate(`/${locale}/admin?tab=projects`, { replace: true });
        return;
      }
      setProject(data);
      setLoading(false);
    });
  }, [id, locale, navigate]);

  async function handleSubmit(input: ProjectInput) {
    if (!id) return;
    try {
      await updateProject(id, input);
      toast.success(tToast('project_updated'));
      navigate(`/${locale}/admin?tab=projects`);
    } catch {
      toast.error(tToast('project_update_failed'));
    }
  }

  function handleBackClick(event: React.MouseEvent) {
    if (isDirty && !window.confirm(tForm('unsavedWarning'))) {
      event.preventDefault();
    }
  }

  if (loading || !project) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-10 sm:pb-20">
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <TransitionLink
          href={`/${locale}/admin?tab=projects`}
          onClick={handleBackClick}
          className="text-xs font-mono text-muted-foreground hover:text-foreground"
          direction="backward"
        >
          {t('backToDashboard')}
        </TransitionLink>
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{t('editTitle')}</span>
      </div>
      <ProjectEditorForm
        draftKey={id ?? 'unknown'}
        submitLabel={t('saveChanges')}
        onSubmit={handleSubmit}
        onDirtyChange={setIsDirty}
        initialValues={{
          title: project.title,
          description: project.description,
          content_md: project.content_md,
          content_json: project.content_json,
          status: project.status,
          is_published: project.is_published,
          thumbnail_url: project.thumbnail_url,
          created_at: project.created_at,
          updated_at: project.updated_at,
        }}
      />
    </section>
  );
}
