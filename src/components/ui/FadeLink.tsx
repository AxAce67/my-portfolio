'use client';

import { useRouter } from '@/i18n/routing';

const OVERLAY_ID = '__page-fade-overlay__';

interface Props {
    href: string;
    className?: string;
    children: React.ReactNode;
}

export function FadeLink({ href, className, children }: Props) {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (document.getElementById(OVERLAY_ID)) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            router.push(href);
            return;
        }

        const bgColor = getComputedStyle(document.documentElement).backgroundColor;
        const bgAlpha = bgColor.replace(/^rgb\(/, 'rgba(').replace(/\)$/, ', 0.9)');

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.cssText = [
            'position:fixed', 'inset:0',
            `background:${bgAlpha}`,
            'backdrop-filter:blur(20px)',
            '-webkit-backdrop-filter:blur(20px)',
            'z-index:99999', 'opacity:0', 'pointer-events:all',
        ].join(';');
        document.body.appendChild(overlay);

        void overlay.offsetHeight;
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.opacity = '1';

        setTimeout(() => {
            router.push(href);
        }, 320);
    };

    return (
        <a href={href} onClick={handleClick} className={className}>
            {children}
        </a>
    );
}
