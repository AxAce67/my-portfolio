'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransitionRouter } from 'next-view-transitions';
import { useEffect, useState } from 'react';
import { canUseSharedElementTransitions, isPlainLeftClick, runRouteTransition, shouldUseMobileRouteTransitions } from '@/lib/viewTransitions';
import { navigationStateKeys, readSessionValue, removeSessionValue, writeSessionValue } from '@/lib/navigationState';

type Props = {
  homeHref: string;
  archiveHref: string;
  className?: string;
  homeLabel: string;
  archiveLabel: string;
};

export default function BackToProjectsLink({ homeHref, archiveHref, className, homeLabel, archiveLabel }: Props) {
  const router = useRouter();
  const transitionRouter = useTransitionRouter();
  const [referrer] = useState(() =>
    readSessionValue(navigationStateKeys.projectsReferrer)
  );
  const isArchive = referrer === 'archive';
  const targetHref = isArchive ? archiveHref : homeHref;

  useEffect(() => {
    router.prefetch(targetHref);
  }, [router, targetHref]);

  return (
    <Link
      href={targetHref}
      prefetch
      className={className}
      onClick={(e) => {
        if (!isPlainLeftClick(e)) {
          return;
        }

        removeSessionValue(navigationStateKeys.projectsReferrer);
        writeSessionValue(navigationStateKeys.returnToProjects, '1');
        if (shouldUseMobileRouteTransitions()) {
          e.preventDefault();
          runRouteTransition(() => {
            router.push(targetHref, { scroll: false });
          }, { direction: 'backward' });
          return;
        }

        if (canUseSharedElementTransitions()) {
          e.preventDefault();
          if (isArchive) {
            transitionRouter.push(targetHref, { scroll: false });
            return;
          }

          const clearPendingResolver = () => {
            window.__resolveHomeProjectsTransition = undefined;
          };

          const timeoutId = window.setTimeout(() => {
            window.__resolveHomeProjectsTransition?.();
            clearPendingResolver();
          }, 900);

          document.startViewTransition?.(() => new Promise<void>((resolve) => {
            window.__resolveHomeProjectsTransition = () => {
              window.clearTimeout(timeoutId);
              clearPendingResolver();
              resolve();
            };

            router.push(targetHref, { scroll: false });
          }));
          return;
        }
      }}
    >
      {isArchive ? archiveLabel : homeLabel}
    </Link>
  );
}
