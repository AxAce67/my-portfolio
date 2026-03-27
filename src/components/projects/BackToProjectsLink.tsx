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
  const [isArchive] = useState(() =>
    typeof window !== 'undefined' && sessionStorage.getItem('projectsReferrer') === 'archive'
  );

  return (
    <Link
      href={isArchive ? archiveHref : homeHref}
      prefetch
      className={className}
      onClick={(e) => {
        const dest = isArchive ? archiveHref : homeHref;
        sessionStorage.removeItem('projectsReferrer');
        sessionStorage.setItem('returnToProjects', '1');
        if ('startViewTransition' in document) {
          e.preventDefault();
          transitionRouter.push(dest, { scroll: false });
        }
      }}
    >
      {isArchive ? archiveLabel : homeLabel}
    </Link>
  );
}
