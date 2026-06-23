import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { deleteProject } from '@/lib/content/adminContent';

type Props = {
  projectId: string;
  projectTitle: string;
  onDeleted: () => void;
};

const modalBaseClass = 'fixed inset-0 z-[2147483647] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4';

export default function DeleteProjectButton({ projectId, projectTitle, onDeleted }: Props) {
  const t = useTranslations('Dashboard.deleteProject');
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteProject(projectId);
      setOpen(false);
      onDeleted();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t('button')}
        aria-label={t('button')}
        className="flex-1 sm:flex-none min-h-11 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-300 inline-flex items-center justify-center"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {open
        ? createPortal(
            <div className={modalBaseClass} onClick={() => setOpen(false)}>
              <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
                <h3 className="text-lg font-semibold">{t('title')}</h3>
                <p className="text-sm text-muted-foreground">{t('description', { title: projectTitle })}</p>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                  <button type="button" className="btn-outline px-3 py-2 text-xs w-full sm:w-auto" onClick={() => setOpen(false)}>
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="rounded-lg border border-red-600 bg-red-600 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
                  >
                    {isDeleting ? '…' : t('confirm')}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
