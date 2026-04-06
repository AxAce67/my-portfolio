'use client';

import type { ComponentProps, FocusEvent, MouseEvent } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { isPlainLeftClick, runRouteTransition } from '@/lib/viewTransitions';

type Props = ComponentProps<typeof Link> & {
    direction?: 'forward' | 'backward';
    variant?: 'default' | 'document';
};

export function TransitionLink({
    href,
    onClick,
    onFocus,
    onMouseEnter,
    replace,
    scroll,
    direction = 'forward',
    variant = 'default',
    target,
    ...props
}: Props) {
    const router = useRouter();
    const canPrefetch = typeof href === 'string' && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:');

    const prefetchRoute = () => {
        if (!canPrefetch) {
            return;
        }
        router.prefetch(href);
    };

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(event);

        if (!isPlainLeftClick(event) || target === '_blank' || typeof href !== 'string') {
            return;
        }

        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }

        event.preventDefault();
        runRouteTransition(() => {
            const navigationOptions = scroll === undefined ? undefined : { scroll };
            if (replace) {
                if (navigationOptions) {
                    router.replace(href, navigationOptions);
                    return;
                }
                router.replace(href);
                return;
            }

            if (navigationOptions) {
                router.push(href, navigationOptions);
                return;
            }
            router.push(href);
        }, { direction, variant });
    };

    const handleMouseEnter = (event: MouseEvent<HTMLAnchorElement>) => {
        onMouseEnter?.(event);
        prefetchRoute();
    };

    const handleFocus = (event: FocusEvent<HTMLAnchorElement>) => {
        onFocus?.(event);
        prefetchRoute();
    };

    return (
        <Link
            href={href}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onFocus={handleFocus}
            replace={replace}
            scroll={scroll}
            target={target}
            {...props}
        />
    );
}
