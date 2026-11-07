'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Mail, MailOpen, Reply, Trash2 } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import {
  deleteContactMessage,
  listContactMessages,
  setContactMessageStatus,
  type AdminContactMessage,
  type ContactMessageStatus,
} from '@/lib/content/adminContent';
import { AdminModal, ConfirmDeleteModal, DANGER_ICON_BUTTON_CLASS, ICON_BUTTON_CLASS, PRIMARY_BUTTON_CLASS, ROW_CLASS, RowSkeleton } from './adminUi';

type Filter = 'all' | 'new';

const STATUS_BADGE: Record<ContactMessageStatus, string> = {
  new: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  read: 'border-border bg-muted text-muted-foreground',
  replied: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
};

function replyHref(message: AdminContactMessage) {
  const subject = /^re:/i.test(message.subject) ? message.subject : `Re: ${message.subject}`;
  return `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(subject)}`;
}

export default function ContactInbox() {
  const t = useTranslations('Dashboard.inbox');
  const locale = useLocale();
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    listContactMessages()
      .then(setMessages)
      .catch(() => toast.error(t('loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

  const formatDate = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }),
    [locale],
  );
  const unreadCount = messages.filter((message) => message.status === 'new').length;
  const visible = filter === 'new' ? messages.filter((message) => message.status === 'new') : messages;
  const opened = openId ? messages.find((message) => message.id === openId) ?? null : null;
  const deleting = deletingId ? messages.find((message) => message.id === deletingId) ?? null : null;

  async function changeStatus(id: string, status: ContactMessageStatus) {
    const previous = messages;
    setMessages((current) => current.map((message) => (message.id === id ? { ...message, status } : message)));
    try {
      await setContactMessageStatus(id, status);
    } catch {
      setMessages(previous);
      toast.error(t('updateFailed'));
    }
  }

  function open(message: AdminContactMessage) {
    setOpenId(message.id);
    if (message.status === 'new') void changeStatus(message.id, 'read');
  }

  async function confirmDelete() {
    if (!deletingId) return;
    setIsPending(true);
    try {
      await deleteContactMessage(deletingId);
      setMessages((current) => current.filter((message) => message.id !== deletingId));
      if (openId === deletingId) setOpenId(null);
      setDeletingId(null);
      toast.success(t('deleted'));
    } catch {
      toast.error(t('deleteFailed'));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="inline-flex w-full rounded-lg border border-border p-1 sm:w-auto">
          {(['all', 'new'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-mono transition-colors sm:flex-none ${filter === value ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {value === 'all' ? t('filters.all', { count: messages.length }) : t('filters.unread', { count: unreadCount })}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card p-4 sm:p-6">
        {loading && <RowSkeleton count={3} />}
        {!loading &&
          visible.map((message) => (
            <button key={message.id} type="button" onClick={() => open(message)} className={`${ROW_CLASS} flex w-full items-center gap-3 text-left`}>
              {message.status === 'new' ? (
                <Mail className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" aria-hidden />
              ) : (
                <MailOpen className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${message.status === 'new' ? 'font-semibold' : ''}`}>{message.subject}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {message.name} · {formatDate.format(new Date(message.createdAt))}
                </p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-mono ${STATUS_BADGE[message.status]}`}>
                {t(`status.${message.status}`)}
              </span>
            </button>
          ))}
        {!loading && visible.length === 0 && <p className="text-sm text-muted-foreground">{filter === 'new' ? t('emptyUnread') : t('empty')}</p>}
      </div>

      {opened && (
        <AdminModal title={opened.subject} closeLabel={t('actions.close')} onClose={() => setOpenId(null)}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">{t('fields.from')}</dt>
            <dd className="min-w-0 break-words">
              {opened.name}
              {opened.email && <span className="text-muted-foreground"> &lt;{opened.email}&gt;</span>}
            </dd>
            <dt className="text-muted-foreground">{t('fields.received')}</dt>
            <dd>{formatDate.format(new Date(opened.createdAt))}</dd>
            {opened.locale && (
              <>
                <dt className="text-muted-foreground">{t('fields.language')}</dt>
                <dd className="font-mono text-xs leading-5">{opened.locale}</dd>
              </>
            )}
          </dl>
          <p className="mt-4 whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-3 text-sm leading-relaxed">{opened.message}</p>
          {!opened.email && <p className="mt-3 text-xs text-muted-foreground">{t('noEmail')}</p>}
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              title={t('actions.delete')}
              aria-label={t('actions.delete')}
              className={DANGER_ICON_BUTTON_CLASS}
              onClick={() => setDeletingId(opened.id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title={t('actions.markUnread')}
              aria-label={t('actions.markUnread')}
              className={ICON_BUTTON_CLASS}
              onClick={() => {
                void changeStatus(opened.id, 'new');
                setOpenId(null);
              }}
            >
              <Mail className="h-4 w-4" />
            </button>
            {opened.email && (
              <a
                href={replyHref(opened)}
                className={PRIMARY_BUTTON_CLASS}
                onClick={() => {
                  if (opened.status !== 'replied') void changeStatus(opened.id, 'replied');
                }}
              >
                <Reply className="h-4 w-4" />
                {t('actions.reply')}
              </a>
            )}
          </div>
        </AdminModal>
      )}

      {deleting && (
        <ConfirmDeleteModal
          title={t('deleteModal.title')}
          description={t('deleteModal.description', { subject: deleting.subject })}
          cancelLabel={t('actions.cancel')}
          confirmLabel={t('actions.delete')}
          pending={isPending}
          onCancel={() => setDeletingId(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
