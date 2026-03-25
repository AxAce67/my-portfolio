'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { deleteProjectAction } from '@/app/[locale]/dashboard/actions';

type Props = {
  locale: string;
  projectId: string;
  projectTitle: string;
};

const modalBaseClass =
  'fixed inset-0 z-[2147483647] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4';

export default function DeleteProjectButton({ locale, projectId, projectTitle }: Props) {
  const t = useTranslations('Dashboard.deleteProject');
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const action = useMemo(() => deleteProjectAction.bind(null, locale, projectId), [locale, projectId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-1 sm:flex-none rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-300"
      >
        {t('button')}
      </button>

      {open
        ? createPortal(
            <div className={modalBaseClass} onClick={() => setOpen(false)}>
              <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
                <h3 className="text-lg font-semibold">{t('title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('description', { title: projectTitle })}
                </p>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                  <button type="button" className="btn-outline px-3 py-2 text-xs w-full sm:w-auto" onClick={() => setOpen(false)}>
                    {t('cancel')}
                  </button>
                  <form action={action} onSubmit={() => { setIsDeleting(true); setOpen(false); }}>
                    <button
                      type="submit"
                      disabled={isDeleting}
                      className="rounded-lg border border-red-600 bg-red-600 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
                    >
                      {isDeleting ? '...' : t('confirm')}
                    </button>
                  </form>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
