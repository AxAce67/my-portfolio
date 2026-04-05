'use client';

import { Link, useRouter } from '@/i18n/routing';
import { isPlainLeftClick, runViewTransition } from '@/lib/viewTransitions';

interface Props {
    href: string;
    className?: string;
    children: React.ReactNode;
}

export function FadeLink({ href, className, children }: Props) {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!isPlainLeftClick(e)) {
            return;
        }

        e.preventDefault();
        runViewTransition(() => {
            router.push(href);
        });
    };

    return (
        <Link href={href} onClick={handleClick} className={className}>
            {children}
        </Link>
    );
}
