'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

type Props = {
  children: ReactNode;
};

function shouldAnimateOnMobile() {
  return typeof window !== 'undefined'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && window.matchMedia('(pointer: coarse), (any-pointer: coarse)').matches;
}

export function MobilePageMotion({ children }: Props) {
  const location = useLocation();
  const pathname = location.pathname;
  const [animateOnMobile, setAnimateOnMobile] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAnimateOnMobile(shouldAnimateOnMobile());
    };

    sync();

    const pointerMedia = window.matchMedia('(pointer: coarse), (any-pointer: coarse)');
    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

    pointerMedia.addEventListener?.('change', sync);
    reducedMotionMedia.addEventListener?.('change', sync);

    return () => {
      pointerMedia.removeEventListener?.('change', sync);
      reducedMotionMedia.removeEventListener?.('change', sync);
    };
  }, []);

  if (!animateOnMobile) {
    return <>{children}</>;
  }

  return (
    <div key={pathname} className="mobile-page-motion">
      {children}
    </div>
  );
}
