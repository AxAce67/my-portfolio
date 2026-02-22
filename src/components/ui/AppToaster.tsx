'use client';

import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      toastOptions={{
        duration: 2600,
      }}
    />
  );
}
