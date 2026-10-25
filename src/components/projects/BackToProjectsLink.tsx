'use client';

import { Link, useRouter } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { canUseSharedElementTransitions, isPlainLeftClick, runRouteTransition, runViewTransition, shouldUseMobileRouteTransitions } from '@/lib/viewTransitions';
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
      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!isPlainLeftClick(e)) {
          return;
        }

        removeSessionValue(navigationStateKeys.projectsReferrer);
        writeSessionValue(navigationStateKeys.returnToProjects, '1');
        if (shouldUseMobileRouteTransitions()) {
          e.preventDefault();
          runRouteTransition(() => {
            router.push(targetHref);
          }, { direction: 'backward' });
          return;
        }

        if (canUseSharedElementTransitions()) {
          e.preventDefault();
          // runViewTransition waits until the destination has committed, and
          // the home page restores its scroll position in a layout effect
          // during that commit, so the card is in place for the morph.
          runViewTransition(() => {
            router.push(targetHref);
          });
        }
      }}
    >
      {isArchive ? archiveLabel : homeLabel}
    </Link>
  );
}
