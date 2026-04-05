import type { ReactNode } from 'react';
import { TransitionLink } from '@/components/ui/TransitionLink';

type Props = {
  href: string;
  children: ReactNode;
};

const EXTERNAL_PROTOCOL_RE = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
const SAFE_EXTERNAL_PROTOCOL_RE = /^(https?:|mailto:|tel:)/i;

export function ContentLink({ href, children }: Props) {
  const normalizedHref = href.trim();

  if (!normalizedHref) {
    return <>{children}</>;
  }

  if (normalizedHref.startsWith('#')) {
    return <a href={normalizedHref}>{children}</a>;
  }

  if (normalizedHref.startsWith('/')) {
    return <TransitionLink href={normalizedHref}>{children}</TransitionLink>;
  }

  if (EXTERNAL_PROTOCOL_RE.test(normalizedHref)) {
    if (!SAFE_EXTERNAL_PROTOCOL_RE.test(normalizedHref)) {
      return <>{children}</>;
    }

    return (
      <a href={normalizedHref} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return <a href={normalizedHref}>{children}</a>;
}
