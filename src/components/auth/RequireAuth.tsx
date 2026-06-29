'use client';

import { useEffect, type ReactNode } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useRouter } from '@/i18n/routing';
import { useSession } from '@/lib/auth/useSession';

type Props = {
  children: ReactNode;
};

export default function RequireAuth({ children }: Props) {
  const { user, loading } = useSession();
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/${locale}/admin`);
    }
  }, [loading, locale, router, user]);

  if (loading) return null;

  if (!user) return null;

  return <>{children}</>;
}
