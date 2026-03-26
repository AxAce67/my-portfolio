'use client';

import Link from 'next/link';
import { useTransitionRouter } from 'next-view-transitions';
import type { ReactNode } from 'react';

type Props = {
  homeHref: string;
  archiveHref: string;
  className?: string;
  children: ReactNode;
};

export default function BackToProjectsLink({ homeHref, archiveHref, className, children }: Props) {
  const transitionRouter = useTransitionRouter();

  return (
    <Link
      href={homeHref}
      prefetch
      className={className}
      onClick={(e) => {
        const dest = sessionStorage.getItem('projectsReferrer') === 'archive' ? archiveHref : homeHref;
        sessionStorage.removeItem('projectsReferrer');
        sessionStorage.setItem('returnToProjects', '1');
        if ('startViewTransition' in document) {
          e.preventDefault();
          transitionRouter.push(dest);
        }
      }}
    >
      {children}
    </Link>
  );
}
