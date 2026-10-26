import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { deleteProject } from '@/lib/content/adminContent';
import { toast } from 'sonner';
import { ConfirmDeleteModal, DANGER_ICON_BUTTON_CLASS } from './adminUi';

type Props = {
  projectId: string;
  projectTitle: string;
  onDeleted: () => void;
};

export default function DeleteProjectButton({ projectId, projectTitle, onDeleted }: Props) {
  const t = useTranslations('Dashboard.deleteProject');
  const tToast = useTranslations('Dashboard.toast');
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      setOpen(false);
      onDeleted();
    } catch {
      toast.error(tToast('project_delete_failed'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title={t('button')} aria-label={t('button')} className={DANGER_ICON_BUTTON_CLASS}>
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {open && (
        <ConfirmDeleteModal
          title={t('title')}
          description={t('description', { title: projectTitle })}
          cancelLabel={t('cancel')}
          confirmLabel={t('confirm')}
          pending={isDeleting}
          onCancel={() => setOpen(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
