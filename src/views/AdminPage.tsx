'use client';

import { account } from '@/lib/appwrite/client';
import { useSession } from '@/lib/auth/useSession';
import LoginForm from '@/components/auth/LoginForm';
import DashboardPage from './DashboardPage';

export default function AdminPage() {
  const { user, loading, refresh } = useSession();

  if (loading) return null;

  if (!user) {
    return <LoginForm onSuccess={refresh} />;
  }

  async function handleSignOut() {
    await account.deleteSession({ sessionId: 'current' });
    refresh();
  }

  return <DashboardPage onSignOut={handleSignOut} />;
}
