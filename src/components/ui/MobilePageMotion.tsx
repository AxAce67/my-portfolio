'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

type Props = {
  children: ReactNode;
};

function shouldAnimateOnMobile() {
  return typeof window !== 'undefined'
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && window.matchMedia('(pointer: coarse), (any-pointer: coarse)').matches;
}

export function MobilePageMotion({ children }: Props) {
  const pathname = usePathname();
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
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="mobile-page-motion"
    >
      {children}
    </motion.div>
  );
}
