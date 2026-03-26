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
        const isArchive = sessionStorage.getItem('projectsReferrer') === 'archive';
        const dest = isArchive ? archiveHref : homeHref;
        sessionStorage.removeItem('projectsReferrer');
        sessionStorage.setItem('returnToProjects', '1');
        if ('startViewTransition' in document) {
          e.preventDefault();
          // scroll: false でアーカイブ戻りはuseLayoutEffectのスクロール復元に任せる
          transitionRouter.push(dest, { scroll: !isArchive });
        }
      }}
    >
      {children}
    </Link>
  );
}
