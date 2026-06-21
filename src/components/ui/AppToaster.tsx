'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/components/providers/ThemeProvider';

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
        style: {
          zIndex: 2147483648,
        },
      }}
    />
  );
}
