'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export default function ToastNotice() {
  const t = useTranslations('Dashboard.toast');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const handledRef = useRef<string>('');
  const messageMap = useMemo<Record<string, string>>(
    () => ({
      project_created: t('project_created'),
      project_updated: t('project_updated'),
      project_deleted: t('project_deleted'),
      active_created: t('active_created'),
      active_updated: t('active_updated'),
      active_deleted: t('active_deleted'),
    }),
    [t]
  );

  useEffect(() => {
    const code = searchParams.get('toast') ?? '';
    const at = searchParams.get('toastAt') ?? '';
    const key = `${code}:${at}`;

    if (!code || !messageMap[code] || handledRef.current === key) return;

    handledRef.current = key;
    toast.success(messageMap[code]);

    const next = new URLSearchParams(searchParams.toString());
    next.delete('toast');
    next.delete('toastAt');

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [messageMap, pathname, router, searchParams]);

  return null;
}
