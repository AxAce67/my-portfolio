'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import {
  createActiveProjectAction,
  updateActiveProjectAction,
  deleteActiveProjectAction,
} from '@/app/[locale]/dashboard/actions';

type ActiveProjectItem = {
  id: string;
  name: string;
  stage: number;
  display_order: number;
  is_published: boolean;
  updated_at: string;
};

type Props = {
  locale: string;
  projects: ActiveProjectItem[];
};

export default function ActiveProjectsManager({ locale, projects }: Props) {
  const t = useTranslations('Dashboard.active');
  const [mounted, setMounted] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const stageOptions = [
    { value: 0, label: t('stage.planning') },
    { value: 1, label: t('stage.design') },
    { value: 2, label: t('stage.development') },
    { value: 3, label: t('stage.testing') },
    { value: 4, label: t('stage.completed') },
  ] as const;

  const editingProject = useMemo(
    () => projects.find((project) => project.id === editingProjectId) ?? null,
    [projects, editingProjectId]
  );
  const deletingProject = useMemo(
    () => projects.find((project) => project.id === deletingProjectId) ?? null,
    [projects, deletingProjectId]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const modalBaseClass =
    'fixed inset-0 z-[2147483647] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4';

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          {t('newButton')}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
        {(projects ?? []).map((project) => (
          <div key={project.id} className="border border-border rounded-lg px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{project.name}</p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                  {stageOptions.find((option) => option.value === project.stage)?.label ?? project.stage}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                  {t('priority')}: {project.display_order}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                  {project.is_published ? t('published') : t('draft')}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <button type="button" className="btn-outline flex-1 sm:flex-none px-3 py-2 text-xs" onClick={() => setEditingProjectId(project.id)}>
                {t('actions.edit')}
              </button>
              <button
                type="button"
                className="flex-1 sm:flex-none rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-300"
                onClick={() => setDeletingProjectId(project.id)}
              >
                {t('actions.delete')}
              </button>
            </div>
          </div>
        ))}
        {(projects ?? []).length === 0 && <p className="text-sm text-muted-foreground">{t('empty')}</p>}
      </div>

      {mounted && createOpen
        ? createPortal(
            <div className={modalBaseClass} onClick={() => setCreateOpen(false)}>
              <div className="relative w-full max-w-xl rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-lg font-semibold">{t('createModal.title')}</h3>
                  <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={() => setCreateOpen(false)}>
                    {t('actions.close')}
                  </button>
                </div>
                <form action={createActiveProjectAction.bind(null, locale)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.name')}</label>
                    <input name="name" required placeholder={t('fields.namePlaceholder')} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.stage')}</label>
                    <select name="stage" defaultValue={0} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm">
                      {stageOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.priority')}</label>
                    <input name="display_order" type="number" min={0} defaultValue={0} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <input type="checkbox" name="is_published" defaultChecked />
                      {t('published')}
                    </label>
                    <button type="submit" className="btn-primary w-full sm:w-auto">{t('actions.create')}</button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}

      {mounted && editingProject
        ? createPortal(
            <div className={modalBaseClass} onClick={() => setEditingProjectId(null)}>
              <div className="relative w-full max-w-xl rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-lg font-semibold">{t('editModal.title')}</h3>
                  <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={() => setEditingProjectId(null)}>
                    {t('actions.close')}
                  </button>
                </div>
                <form action={updateActiveProjectAction.bind(null, locale, editingProject.id)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.name')}</label>
                    <input name="name" defaultValue={editingProject.name} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.stage')}</label>
                    <select name="stage" defaultValue={editingProject.stage} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm">
                      {stageOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.priority')}</label>
                    <input
                      name="display_order"
                      type="number"
                      min={0}
                      defaultValue={editingProject.display_order}
                      className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <input type="checkbox" name="is_published" defaultChecked={editingProject.is_published} />
                      {t('published')}
                    </label>
                    <button type="submit" className="btn-primary w-full sm:w-auto">{t('actions.update')}</button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}

      {mounted && deletingProject
        ? createPortal(
            <div className={modalBaseClass} onClick={() => setDeletingProjectId(null)}>
              <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
                <h3 className="text-lg font-semibold">{t('deleteModal.title')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('deleteModal.description', { name: deletingProject.name })}
                </p>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                  <button type="button" className="btn-outline px-3 py-2 text-xs w-full sm:w-auto" onClick={() => setDeletingProjectId(null)}>
                    {t('actions.cancel')}
                  </button>
                  <form action={deleteActiveProjectAction.bind(null, locale, deletingProject.id)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-red-600 bg-red-600 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 w-full sm:w-auto"
                    >
                      {t('actions.delete')}
                    </button>
                  </form>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
