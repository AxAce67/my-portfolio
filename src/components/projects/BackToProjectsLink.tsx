'use client';

import Link from 'next/link';
import { useTransitionRouter } from 'next-view-transitions';
import { useState } from 'react';

type Props = {
  homeHref: string;
  archiveHref: string;
  className?: string;
  homeLabel: string;
  archiveLabel: string;
};

export default function BackToProjectsLink({ homeHref, archiveHref, className, homeLabel, archiveLabel }: Props) {
  const transitionRouter = useTransitionRouter();
  const [referrer] = useState(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem('projectsReferrer') : null
  );
  const isArchive = referrer === 'archive';
  // ホームまたはアーカイブから来た場合はrouter.back()でrouter cacheを使い即座に復元
  const canGoBack = referrer === 'home' || referrer === 'archive';

  return (
    <Link
      href={isArchive ? archiveHref : homeHref}
      prefetch
      className={className}
      onClick={(e) => {
        sessionStorage.removeItem('projectsReferrer');
        sessionStorage.setItem('returnToProjects', '1');
        if ('startViewTransition' in document) {
          e.preventDefault();
          if (canGoBack) {
            transitionRouter.back();
          } else {
            transitionRouter.push(isArchive ? archiveHref : homeHref, { scroll: false });
          }
        }
      }}
    >
      {isArchive ? archiveLabel : homeLabel}
    </Link>
  );
}
