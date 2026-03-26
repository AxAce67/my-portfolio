'use client';

import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function LocaleTemplate({ children }: Props) {
  return <>{children}</>;
}
