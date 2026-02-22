import { createClient } from '@/lib/supabase/server';

export function getAdminUserId() {
  return (process.env.PORTFOLIO_ADMIN_USER_ID ?? '').trim();
}

export async function isAdminUser(userId: string | null | undefined) {
  const adminUserId = getAdminUserId();
  if (!userId) return false;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('portfolio_user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data?.role === 'admin') {
      return true;
    }
  } catch {
    // ignore and fall back to env-based check
  }

  if (!adminUserId) return false;
  return adminUserId === userId;
}
