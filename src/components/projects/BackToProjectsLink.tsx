'use client';

import Link from 'next/link';
import { useTransitionRouter } from 'next-view-transitions';
import type { ReactNode } from 'react';

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
};

export default function BackToProjectsLink({ href, className, children }: Props) {
  const transitionRouter = useTransitionRouter();
  return (
    <Link
      href={href}
      prefetch
      className={className}
      onClick={(e) => {
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

