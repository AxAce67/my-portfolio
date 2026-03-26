'use client';

import { Link } from '@/i18n/routing';
import type { ReactNode } from 'react';

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

export default function BackToProjectsLink({ href, className, children }: Props) {
  return (
    <Link
      href={href as Parameters<typeof Link>[0]['href']}
      prefetch
      className={className}
      onClick={() => {
        sessionStorage.setItem('returnToProjects', '1');
      }}
    >
      {children}
    </Link>
  );
}

