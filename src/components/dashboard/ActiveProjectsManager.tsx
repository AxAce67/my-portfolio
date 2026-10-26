import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from '@/hooks/useTranslations';
import { SwitchTrack } from '@/components/ui/SwitchTrack';
import {
  createActiveProject,
  deleteActiveProject,
  listAdminActiveProjects,
  updateActiveProject,
  type ActiveProjectInput,
  type AdminActiveProject,
} from '@/lib/content/adminContent';
import {
  AdminModal,
  ConfirmDeleteModal,
  DANGER_ICON_BUTTON_CLASS,
  FIELD_LABEL_CLASS,
  ICON_BUTTON_CLASS,
  INPUT_CLASS,
  PRIMARY_BUTTON_CLASS,
  ROW_CLASS,
  RowSkeleton,
} from './adminUi';

const STAGE_COUNT = 5;

type StageOption = { value: number; label: string; badgeClass: string };

type FormState = { id: string | null; name: string; stage: number; is_published: boolean };

function toInput(project: AdminActiveProject): ActiveProjectInput {
  return { name: project.name, stage: project.stage, display_order: project.display_order, is_published: project.is_published };
}

type RowLabels = { dragHandle: string; published: string; draft: string; edit: string; delete: string };

type ActiveProjectRowContentProps = {
  project: AdminActiveProject;
  stageOptions: readonly StageOption[];
  labels: RowLabels;
  dragHandleProps?: Record<string, unknown>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStage?: (id: string, stage: number) => void;
  onTogglePublished?: (id: string) => void;
};

function ActiveProjectRowContent({ project, stageOptions, labels, dragHandleProps, onEdit, onDelete, onStage, onTogglePublished }: ActiveProjectRowContentProps) {
  const currentStage = Math.max(0, Math.min(STAGE_COUNT - 1, project.stage));
  const lineInsetPercent = 50 / STAGE_COUNT;
  const lineTrackPercent = 100 - lineInsetPercent * 2;
  const progressWidthPercent = lineInsetPercent + (currentStage / (STAGE_COUNT - 1)) * lineTrackPercent;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <button
        type="button"
        {...dragHandleProps}
        title={labels.dragHandle}
        aria-label={labels.dragHandle}
        className="shrink-0 cursor-grab touch-none border-none bg-transparent p-0 text-muted-foreground active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onEdit?.(project.id)}
        className="min-w-24 flex-1 truncate text-left text-sm font-medium underline-offset-4 hover:underline"
      >
        {project.name}
      </button>

      <div className="flex items-center gap-3">
        <span className={`hidden w-14 shrink-0 rounded-sm px-2 py-0.5 text-center font-mono text-[10px] sm:inline-block ${stageOptions[currentStage].badgeClass}`}>
          {stageOptions[currentStage].label}
        </span>

        {/* Each dot sets that stage directly. */}
        <div className="relative w-28 shrink-0">
          <div className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-border" style={{ left: `${lineInsetPercent}%`, right: `${lineInsetPercent}%` }} />
          <div className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-foreground" style={{ width: `${progressWidthPercent}%` }} />
          <div className="relative flex justify-between">
            {stageOptions.map((stage, i) => (
              <button
                key={stage.value}
                type="button"
                title={stage.label}
                aria-label={stage.label}
                aria-pressed={i === currentStage}
                disabled={!onStage}
                onClick={() => onStage?.(project.id, stage.value)}
                className="flex h-5 w-5 items-center justify-center rounded-full disabled:cursor-default"
              >
                <span
                  className={`flex h-[11px] w-[11px] items-center justify-center rounded-full border-2 transition-transform ${
                    i <= currentStage ? 'border-foreground bg-foreground' : 'border-border bg-background hover:border-foreground/50'
                  } ${onStage ? 'hover:scale-125' : ''}`}
                >
                  {i === currentStage && <span className="h-[4px] w-[4px] rounded-full bg-background" />}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={project.is_published}
          onClick={() => onTogglePublished?.(project.id)}
          className="inline-flex min-w-20 items-center gap-2 whitespace-nowrap text-xs text-muted-foreground"
        >
          <SwitchTrack on={project.is_published} size="sm" />
          {project.is_published ? labels.published : labels.draft}
        </button>

        <div className="flex items-center gap-1.5">
          <button type="button" title={labels.edit} aria-label={labels.edit} className={ICON_BUTTON_CLASS} onClick={() => onEdit?.(project.id)}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" title={labels.delete} aria-label={labels.delete} className={DANGER_ICON_BUTTON_CLASS} onClick={() => onDelete?.(project.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

type SortableRowProps = Omit<ActiveProjectRowContentProps, 'dragHandleProps'>;

const SortableActiveProjectRow = memo(function SortableActiveProjectRow(props: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.project.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`${ROW_CLASS} ${isDragging ? 'opacity-30' : ''}`}>
      <ActiveProjectRowContent {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
});

export default function ActiveProjectsManager() {
  const t = useTranslations('Dashboard.active');
  const tProjects = useTranslations('Dashboard.projects');
  const tToast = useTranslations('Dashboard.toast');
  const [projects, setProjects] = useState<AdminActiveProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const stageOptions: StageOption[] = useMemo(
    () => [
      { value: 0, label: t('stage.planning'), badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/25' },
      { value: 1, label: t('stage.design'), badgeClass: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25' },
      { value: 2, label: t('stage.development'), badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25' },
      { value: 3, label: t('stage.testing'), badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25' },
      { value: 4, label: t('stage.completed'), badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' },
    ],
    [t]
  );

  const labels: RowLabels = useMemo(
    () => ({ dragHandle: t('dragHandle'), published: t('published'), draft: t('draft'), edit: t('actions.edit'), delete: t('actions.delete') }),
    [t]
  );

  function load() {
    setLoading(true);
    listAdminActiveProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const deletingProject = useMemo(() => projects.find((project) => project.id === deletingProjectId) ?? null, [projects, deletingProjectId]);

  // Change one row in place and save it; put it back if the save fails.
  const patchProject = useCallback(
    (id: string, patch: Partial<AdminActiveProject>, successMessage?: string) => {
      const before = projects.find((project) => project.id === id);
      if (!before) return;
      const after = { ...before, ...patch };
      setProjects((current) => current.map((project) => (project.id === id ? after : project)));
      updateActiveProject(id, toInput(after)).then(
        () => successMessage && toast.success(successMessage),
        () => {
          setProjects((current) => current.map((project) => (project.id === id ? before : project)));
          toast.error(tToast('active_update_failed'));
        }
      );
    },
    [projects, tToast]
  );

  const handleStage = useCallback(
    (id: string, stage: number) => {
      if (projects.find((project) => project.id === id)?.stage !== stage) patchProject(id, { stage });
    },
    [projects, patchProject]
  );

  const handleTogglePublished = useCallback(
    (id: string) => {
      const project = projects.find((p) => p.id === id);
      if (!project) return;
      const next = !project.is_published;
      patchProject(id, { is_published: next }, next ? tProjects('publishedToast') : tProjects('unpublishedToast'));
    },
    [projects, patchProject, tProjects]
  );

  const handleEdit = useCallback(
    (id: string) => {
      const project = projects.find((p) => p.id === id);
      if (project) setForm({ id, name: project.name, stage: project.stage, is_published: project.is_published });
    },
    [projects]
  );
  const handleDeleteRequest = useCallback((id: string) => setDeletingProjectId(id), []);
  const closeForm = useCallback(() => setForm(null), []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    const editing = form.id ? projects.find((project) => project.id === form.id) : null;
    setIsPending(true);
    try {
      if (editing) {
        await updateActiveProject(editing.id, { name: form.name, stage: form.stage, display_order: editing.display_order, is_published: form.is_published });
        toast.success(tToast('active_updated'));
      } else {
        const nextOrder = projects.reduce((max, project) => Math.max(max, project.display_order), -1) + 1;
        await createActiveProject({ name: form.name, stage: form.stage, display_order: nextOrder, is_published: form.is_published });
        toast.success(tToast('active_created'));
      }
      setForm(null);
      load();
    } catch {
      toast.error(tToast(editing ? 'active_update_failed' : 'active_create_failed'));
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!deletingProject) return;
    setIsPending(true);
    try {
      await deleteActiveProject(deletingProject.id);
      setDeletingProjectId(null);
      toast.success(tToast('active_deleted'));
      load();
    } catch {
      toast.error(tToast('active_delete_failed'));
    } finally {
      setIsPending(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = projects.findIndex((project) => project.id === active.id);
    const toIndex = projects.findIndex((project) => project.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = arrayMove(projects, fromIndex, toIndex).map((project, index) => ({ ...project, display_order: index }));
    const moved = reordered.filter((project) => projects.find((p) => p.id === project.id)?.display_order !== project.display_order);
    setProjects(reordered);

    Promise.all(moved.map((project) => updateActiveProject(project.id, toInput(project)))).catch(() => {
      toast.error(tToast('active_update_failed'));
      load();
    });
  }

  const activeDragProject = activeDragId ? projects.find((project) => project.id === activeDragId) ?? null : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <button type="button" className={`${PRIMARY_BUTTON_CLASS} w-full sm:w-auto`} onClick={() => setForm({ id: null, name: '', stage: 0, is_published: true })}>
          <Plus className="h-4 w-4" />
          {t('newButton')}
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card p-4 sm:p-6">
        {loading && <RowSkeleton count={2} />}
        {!loading && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={projects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {projects.map((project) => (
                  <SortableActiveProjectRow
                    key={project.id}
                    project={project}
                    stageOptions={stageOptions}
                    labels={labels}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    onStage={handleStage}
                    onTogglePublished={handleTogglePublished}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeDragProject ? (
                <div className={`${ROW_CLASS} shadow-xl`}>
                  <ActiveProjectRowContent project={activeDragProject} stageOptions={stageOptions} labels={labels} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
        {!loading && projects.length === 0 && <p className="text-sm text-muted-foreground">{t('empty')}</p>}
      </div>

      {form && (
        <AdminModal title={form.id ? t('editModal.title') : t('createModal.title')} closeLabel={t('actions.close')} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="active-name" className={FIELD_LABEL_CLASS}>
                {t('fields.name')}
              </label>
              <input
                id="active-name"
                required
                autoFocus
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder={t('fields.namePlaceholder')}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <span className={FIELD_LABEL_CLASS}>{t('fields.stage')}</span>
              <div role="radiogroup" aria-label={t('fields.stage')} className="grid grid-cols-5 gap-1 rounded-lg bg-muted p-1">
                {stageOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={form.stage === option.value}
                    onClick={() => setForm({ ...form, stage: option.value })}
                    className={`h-8 rounded-md text-xs transition-colors ${
                      form.stage === option.value ? 'bg-card font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
              <button
                type="button"
                role="switch"
                aria-checked={form.is_published}
                onClick={() => setForm({ ...form, is_published: !form.is_published })}
                className="inline-flex items-center gap-2 text-sm"
              >
                <SwitchTrack on={form.is_published} />
                {form.is_published ? t('published') : t('draft')}
              </button>
              <button type="submit" disabled={isPending} className={PRIMARY_BUTTON_CLASS}>
                {isPending ? '…' : form.id ? t('actions.update') : t('actions.create')}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {deletingProject && (
        <ConfirmDeleteModal
          title={t('deleteModal.title')}
          description={t('deleteModal.description', { name: deletingProject.name })}
          cancelLabel={t('actions.cancel')}
          confirmLabel={t('actions.delete')}
          pending={isPending}
          onCancel={() => setDeletingProjectId(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
