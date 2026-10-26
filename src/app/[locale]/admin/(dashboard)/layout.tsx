import type { ReactNode } from 'react';
import { Suspense } from 'react';
import AdminDashboardShell from '@/views/AdminDashboardShell';

export default function Layout({ children }: { children: ReactNode }) {
  // useSearchParams (for old ?tab= links) needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <AdminDashboardShell>{children}</AdminDashboardShell>
    </Suspense>
  );
}
