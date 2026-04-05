'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { readSessionValue, writeSessionValue } from '@/lib/navigationState';

export default function ToastNotice() {
  const t = useTranslations('Dashboard.toast');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handledRef = useRef<string | null>(null);
  const messageMap = useMemo<Record<string, string>>(
    () => ({
      project_created: t('project_created'),
      project_updated: t('project_updated'),
      project_deleted: t('project_deleted'),
      project_create_failed: t('project_create_failed'),
      project_update_failed: t('project_update_failed'),
      project_delete_failed: t('project_delete_failed'),
      active_created: t('active_created'),
      active_updated: t('active_updated'),
      active_deleted: t('active_deleted'),
      active_create_failed: t('active_create_failed'),
      active_update_failed: t('active_update_failed'),
      active_delete_failed: t('active_delete_failed'),
    }),
    [t]
  );

  useEffect(() => {
    const code = searchParams.get('toast') ?? '';
    const at = searchParams.get('toastAt') ?? '';
    const key = `${code}:${at}`;

    const sessionKey = `toast-shown:${key}`;
    if (!code || !messageMap[code]) return;
    if (handledRef.current === key) return;
    if (readSessionValue(sessionKey)) return;

    handledRef.current = key;
    writeSessionValue(sessionKey, '1');
    if (code.endsWith('_failed')) {
      toast.error(messageMap[code]);
    } else {
      toast.success(messageMap[code]);
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete('toast');
    next.delete('toastAt');

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [messageMap, pathname, router, searchParams]);

  return null;
}
