'use client';

import { TransitionLink } from '@/components/ui/TransitionLink';

interface Props {
    href: string;
    className?: string;
    children: React.ReactNode;
    direction?: 'forward' | 'backward';
}

export function FadeLink({ href, className, children, direction = 'forward' }: Props) {
    return (
        <TransitionLink href={href} className={className} direction={direction}>
            {children}
        </TransitionLink>
    );
}
