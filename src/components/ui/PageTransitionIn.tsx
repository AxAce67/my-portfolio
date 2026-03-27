'use client';

import { useEffect } from 'react';
import { usePathname } from '@/i18n/routing';

const OVERLAY_ID = '__page-fade-overlay__';

// レイアウトに配置してすべてのページ遷移後にオーバーレイを片付ける
export function PageTransitionIn() {
    const pathname = usePathname();

    useEffect(() => {
        const overlay = document.getElementById(OVERLAY_ID);
        if (!overlay) return;

        setTimeout(() => {
            overlay.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            overlay.style.opacity = '0';
            overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
            setTimeout(() => overlay.remove(), 800);
        }, 80);
    }, [pathname]);

    return null;
}
