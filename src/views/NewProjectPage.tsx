'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { TransitionLink } from '@/components/ui/TransitionLink';
import ProjectEditorForm from '@/components/dashboard/ProjectEditorForm';
import { createProject, type ProjectInput } from '@/lib/content/adminContent';

export default function NewProjectPage() {
  const t = useTranslations('Dashboard.editor');
  const tForm = useTranslations('Dashboard.editorForm');
  const tToast = useTranslations('Dashboard.toast');
  const locale = useLocale();
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);

  async function handleSubmit(input: ProjectInput) {
    try {
      const id = await createProject(input);
      toast.success(tToast('project_created'));
      // Keep writing in the editor of the new project rather than leaving.
      router.replace(`/${locale}/admin/projects/${id}`);
    } catch (error) {
      toast.error(tToast('project_create_failed'));
      throw error;
    }
  }

  function handleBackClick(event: React.MouseEvent) {
    if (isDirty && !window.confirm(tForm('unsavedWarning'))) {
      event.preventDefault();
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-10 sm:pb-20">
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <TransitionLink
          href={`/${locale}/admin`}
          onClick={handleBackClick}
          className="back-link"
          direction="backward"
        >
          {t('backToDashboard')}
        </TransitionLink>
        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{t('draftLabel')}</span>
      </div>
      <ProjectEditorForm
        draftKey="new"
        submitLabel={t('createSubmit')}
        onSubmit={handleSubmit}
        onDirtyChange={setIsDirty}
        initialValues={{ status: 'development', is_published: true }}
      />
    </section>
  );
}
