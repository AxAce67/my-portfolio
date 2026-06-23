import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
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
import {
  createActiveProject,
  deleteActiveProject,
  listAdminActiveProjects,
  updateActiveProject,
  type AdminActiveProject,
} from '@/lib/content/adminContent';

const modalBaseClass = 'fixed inset-0 z-[2147483647] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4';
const STAGE_COUNT = 5;

type StageOption = { value: number; label: string; badgeClass: string };

type ActiveProjectRowContentProps = {
  project: AdminActiveProject;
  stageOptions: readonly StageOption[];
  dragHandleLabel: string;
  publishedLabel: string;
  draftLabel: string;
  editLabel: string;
  deleteLabel: string;
  dragHandleProps?: Record<string, unknown>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function ActiveProjectRowContent({
  project,
  stageOptions,
  dragHandleLabel,
  publishedLabel,
  draftLabel,
  editLabel,
  deleteLabel,
  dragHandleProps,
  onEdit,
  onDelete,
}: ActiveProjectRowContentProps) {
  const currentStage = Math.max(0, Math.min(STAGE_COUNT - 1, project.stage));
  const lineInsetPercent = 50 / STAGE_COUNT;
  const lineTrackPercent = 100 - lineInsetPercent * 2;
  const progressWidthPercent = lineInsetPercent + (currentStage / (STAGE_COUNT - 1)) * lineTrackPercent;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        {...dragHandleProps}
        title={dragHandleLabel}
        aria-label={dragHandleLabel}
        className="cursor-grab active:cursor-grabbing text-muted-foreground flex-shrink-0 touch-none bg-transparent border-none p-0"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <p className="text-sm font-medium truncate flex-1 min-w-[5rem]">{project.name}</p>
      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase flex-shrink-0 hidden sm:inline-block">
        {project.is_published ? publishedLabel : draftLabel}
      </span>
      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase flex-shrink-0 hidden sm:inline-block ${stageOptions[currentStage].badgeClass}`}>
        {stageOptions[currentStage].label}
      </span>

      <div className="relative w-16 sm:w-24 flex-shrink-0">
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[2px] bg-border"
          style={{ left: `${lineInsetPercent}%`, right: `${lineInsetPercent}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-[2px] bg-foreground"
          style={{ width: `${progressWidthPercent}%` }}
        />
        <div className="relative flex justify-between">
          {stageOptions.map((stage, i) => {
            const isCompleted = i < currentStage;
            const isCurrent = i === currentStage;
            return (
              <div
                key={stage.value}
                title={stage.label}
                className={`w-[10px] h-[10px] rounded-full border-2 flex items-center justify-center ${
                  isCompleted || isCurrent ? 'bg-foreground border-foreground' : 'bg-background border-border'
                }`}
              >
                {isCurrent && !isCompleted && <div className="w-[4px] h-[4px] rounded-full bg-background" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
        <button
          type="button"
          title={editLabel}
          aria-label={editLabel}
          className="btn-outline px-3 py-2 text-xs inline-flex items-center justify-center"
          onClick={() => onEdit?.(project.id)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title={deleteLabel}
          aria-label={deleteLabel}
          className="min-h-11 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-300 inline-flex items-center justify-center"
          onClick={() => onDelete?.(project.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

type SortableRowProps = Omit<ActiveProjectRowContentProps, 'dragHandleProps'>;

const SortableActiveProjectRow = memo(function SortableActiveProjectRow(props: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bento-card p-4 ${isDragging ? 'opacity-30' : ''}`}>
      <ActiveProjectRowContent {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
});

export default function ActiveProjectsManager() {
  const t = useTranslations('Dashboard.active');
  const tToast = useTranslations('Dashboard.toast');
  const [projects, setProjects] = useState<AdminActiveProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
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

  function load() {
    setLoading(true);
    listAdminActiveProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const editingProject = useMemo(() => projects.find((project) => project.id === editingProjectId) ?? null, [projects, editingProjectId]);
  const deletingProject = useMemo(() => projects.find((project) => project.id === deletingProjectId) ?? null, [projects, deletingProjectId]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsPending(true);
    setCreateOpen(false);
    try {
      const nextOrder = projects.reduce((max, project) => Math.max(max, project.display_order), -1) + 1;
      await createActiveProject({
        name: String(formData.get('name') ?? ''),
        stage: Number(formData.get('stage') ?? 0),
        display_order: nextOrder,
        is_published: formData.get('is_published') === 'on',
      });
      toast.success(tToast('active_created'));
      load();
    } catch {
      toast.error(tToast('active_create_failed'));
    } finally {
      setIsPending(false);
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProject) return;
    const formData = new FormData(event.currentTarget);
    setIsPending(true);
    setEditingProjectId(null);
    try {
      await updateActiveProject(editingProject.id, {
        name: String(formData.get('name') ?? ''),
        stage: Number(formData.get('stage') ?? 0),
        display_order: editingProject.display_order,
        is_published: formData.get('is_published') === 'on',
      });
      toast.success(tToast('active_updated'));
      load();
    } catch {
      toast.error(tToast('active_update_failed'));
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!deletingProject) return;
    setIsPending(true);
    setDeletingProjectId(null);
    try {
      await deleteActiveProject(deletingProject.id);
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
    setProjects(reordered);

    Promise.all(
      reordered.map((project) =>
        updateActiveProject(project.id, {
          name: project.name,
          stage: project.stage,
          display_order: project.display_order,
          is_published: project.is_published,
        })
      )
    ).catch(() => {
      toast.error(tToast('active_update_failed'));
      load();
    });
  }

  const handleEdit = useCallback((id: string) => setEditingProjectId(id), []);
  const handleDeleteRequest = useCallback((id: string) => setDeletingProjectId(id), []);
  const activeDragProject = activeDragId ? projects.find((project) => project.id === activeDragId) ?? null : null;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          {t('newButton')}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
        {!loading && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={projects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {projects.map((project) => (
                  <SortableActiveProjectRow
                    key={project.id}
                    project={project}
                    stageOptions={stageOptions}
                    dragHandleLabel={t('dragHandle')}
                    publishedLabel={t('published')}
                    draftLabel={t('draft')}
                    editLabel={t('actions.edit')}
                    deleteLabel={t('actions.delete')}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeDragProject ? (
                <div className="bento-card p-4 shadow-xl">
                  <ActiveProjectRowContent
                    project={activeDragProject}
                    stageOptions={stageOptions}
                    dragHandleLabel={t('dragHandle')}
                    publishedLabel={t('published')}
                    draftLabel={t('draft')}
                    editLabel={t('actions.edit')}
                    deleteLabel={t('actions.delete')}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
        {!loading && projects.length === 0 && <p className="text-sm text-muted-foreground">{t('empty')}</p>}
      </div>

      {createOpen
        ? createPortal(
            <div className={modalBaseClass} onClick={() => setCreateOpen(false)}>
              <div className="relative w-full max-w-xl rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-lg font-semibold">{t('createModal.title')}</h3>
                  <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={() => setCreateOpen(false)}>
                    {t('actions.close')}
                  </button>
                </div>
                <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.name')}</label>
                    <input name="name" required placeholder={t('fields.namePlaceholder')} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.stage')}</label>
                    <select name="stage" defaultValue={0} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm">
                      {stageOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <input type="checkbox" name="is_published" defaultChecked />
                      {t('published')}
                    </label>
                    <button type="submit" disabled={isPending} className="btn-primary w-full sm:w-auto disabled:opacity-60">{isPending ? '…' : t('actions.create')}</button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}

      {editingProject
        ? createPortal(
            <div className={modalBaseClass} onClick={() => setEditingProjectId(null)}>
              <div className="relative w-full max-w-xl rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-lg font-semibold">{t('editModal.title')}</h3>
                  <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={() => setEditingProjectId(null)}>
                    {t('actions.close')}
                  </button>
                </div>
                <form onSubmit={handleUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.name')}</label>
                    <input name="name" defaultValue={editingProject.name} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.stage')}</label>
                    <select name="stage" defaultValue={editingProject.stage} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm">
                      {stageOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <label className="text-sm text-muted-foreground flex items-center gap-2">
                      <input type="checkbox" name="is_published" defaultChecked={editingProject.is_published} />
                      {t('published')}
                    </label>
                    <button type="submit" disabled={isPending} className="btn-primary w-full sm:w-auto disabled:opacity-60">{isPending ? '…' : t('actions.update')}</button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}

      {deletingProject
        ? createPortal(
            <div className={modalBaseClass} onClick={() => setDeletingProjectId(null)}>
              <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
                <h3 className="text-lg font-semibold">{t('deleteModal.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('deleteModal.description', { name: deletingProject.name })}</p>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                  <button type="button" className="btn-outline px-3 py-2 text-xs w-full sm:w-auto" onClick={() => setDeletingProjectId(null)}>
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleDelete}
                    className="rounded-lg border border-red-600 bg-red-600 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
                  >
                    {isPending ? '…' : t('actions.delete')}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
