'use client';

import { TransitionLink } from '@/components/ui/TransitionLink';

interface Props {
    href: string;
    className?: string;
    children: React.ReactNode;
    direction?: 'forward' | 'backward';
    variant?: 'default' | 'document';
}

export function FadeLink({ href, className, children, direction = 'forward', variant = 'default' }: Props) {
    return (
        <TransitionLink href={href} className={className} direction={direction} variant={variant}>
            {children}
        </TransitionLink>
    );
}
