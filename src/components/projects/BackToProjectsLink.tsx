'use client';

import Link from 'next/link';
import { useTransitionRouter } from 'next-view-transitions';
import { useState } from 'react';
import { isPlainLeftClick } from '@/lib/viewTransitions';
import { navigationStateKeys, readSessionValue, removeSessionValue, writeSessionValue } from '@/lib/navigationState';

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
    readSessionValue(navigationStateKeys.projectsReferrer)
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
        if (!isPlainLeftClick(e)) {
          return;
        }

        removeSessionValue(navigationStateKeys.projectsReferrer);
        writeSessionValue(navigationStateKeys.returnToProjects, '1');
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
