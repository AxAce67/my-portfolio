import { useCallback, useEffect, useState } from 'react';
import type { Models } from 'appwrite';
import { account } from '@/lib/appwrite/client';

type SessionState = {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
};

export function useSession(): SessionState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<SessionState>({ user: null, loading: true });

  const refresh = useCallback(() => {
    return account
      .get()
      .then((user) => setState({ user, loading: false }))
      .catch(() => setState({ user: null, loading: false }));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
