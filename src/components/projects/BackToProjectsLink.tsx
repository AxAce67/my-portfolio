'use client';

import Link from 'next/link';
import { useTransitionRouter } from 'next-view-transitions';
import { useEffect, useState, type ReactNode } from 'react';

type Props = {
  homeHref: string;
  archiveHref: string;
  className?: string;
  children: ReactNode;
};

export default function BackToProjectsLink({ homeHref, archiveHref, className, children }: Props) {
  const transitionRouter = useTransitionRouter();
  const [href, setHref] = useState(homeHref);

  useEffect(() => {
    if (sessionStorage.getItem('projectsReferrer') === 'archive') {
      setHref(archiveHref);
    }
  }, [archiveHref]);

  return (
    <Link
      href={href}
      prefetch
      className={className}
      onClick={(e) => {
        sessionStorage.removeItem('projectsReferrer');
        sessionStorage.setItem('returnToProjects', '1');
        if ('startViewTransition' in document) {
          e.preventDefault();
          transitionRouter.push(href);
        }
      }}
    >
      {children}
    </Link>
  );
}
