import { Navigate, Outlet } from 'react-router-dom';
import { useLocale } from '@/hooks/useLocale';
import { useSession } from '@/lib/auth/useSession';

export default function RequireAuth() {
  const { user, loading } = useSession();
  const locale = useLocale();

  if (loading) return null;

  if (!user) {
    return <Navigate to={`/${locale}/admin`} replace />;
  }

  return <Outlet />;
}
