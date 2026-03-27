'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

const OVERLAY_ID = '__lang-switch-overlay__';
const SCROLL_KEY = '__lang-switch-scroll__';

export function LanguageToggle() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [displayLocale, setDisplayLocale] = useState<'ja' | 'en'>(locale === 'en' ? 'en' : 'ja');
    const [dragDelta, setDragDelta] = useState<number | null>(null);

    const dragRef = useRef<{
        startX: number;
        baseX: number;  // knob の基準 X (px)
        travel: number; // knob の移動距離 (px)
        moved: boolean;
    } | null>(null);

    useEffect(() => {
        setDisplayLocale(locale === 'en' ? 'en' : 'ja');

        const overlay = document.getElementById(OVERLAY_ID);
        if (!overlay) return;

        // 本番ストリーミング環境でコンテンツが描画されるまで待つ
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const savedY = parseInt(sessionStorage.getItem(SCROLL_KEY) ?? '0', 10);
                sessionStorage.removeItem(SCROLL_KEY);
                window.scrollTo(0, savedY);

                setTimeout(() => {
                    overlay.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                    overlay.style.opacity = '0';
                    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
                    setTimeout(() => overlay.remove(), 800);
                }, 200);
            });
        });
    }, [locale]);

    const switchLocale = (newLocale: 'ja' | 'en') => {
        if (document.getElementById(OVERLAY_ID)) return;

        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));

        const bgColor = getComputedStyle(document.documentElement).backgroundColor;
        const bgAlpha = bgColor.replace(/^rgb\(/, 'rgba(').replace(/\)$/, ', 0.9)');

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.cssText = [
            'position:fixed',
            'inset:0',
            `background:${bgAlpha}`,
            'backdrop-filter:blur(20px)',
            '-webkit-backdrop-filter:blur(20px)',
            'z-index:99999',
            'opacity:0',
            'pointer-events:all',
        ].join(';');
        document.body.appendChild(overlay);

        void overlay.offsetHeight;
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.opacity = '1';

        setTimeout(() => {
            router.replace(pathname, { locale: newLocale });
        }, 320);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        // p-0.5 (2px × 2) を引いて正確な knob 移動距離を算出
        const travel = (e.currentTarget.getBoundingClientRect().width - 4) / 2;
        dragRef.current = {
            startX: e.clientX,
            baseX: displayLocale === 'ja' ? 0 : travel,
            travel,
            moved: false,
        };
        setDragDelta(0);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
        const drag = dragRef.current;
        if (!drag) return;
        const rawDelta = e.clientX - drag.startX;
        if (Math.abs(rawDelta) > 4) drag.moved = true;
        const clamped = Math.max(-drag.baseX, Math.min(drag.travel - drag.baseX, rawDelta));
        setDragDelta(clamped);
    };

    const handlePointerUp = () => {
        const drag = dragRef.current;
        if (!drag) return;
        const delta = dragDelta ?? 0;
        dragRef.current = null;
        setDragDelta(null);

        const effectiveX = drag.baseX + delta;
        const isJa = displayLocale === 'ja';

        // ドラッグあり: 中央 (travel/2) を超えたら切替、なければスナップバック
        // クリック (moved=false): 常に切替
        const shouldSwitch = drag.moved
            ? (isJa ? effectiveX > drag.travel / 2 : effectiveX < drag.travel / 2)
            : true;

        if (shouldSwitch) {
            const newLocale = isJa ? 'en' : 'ja';
            // 先に displayLocale を更新して knob を正しい位置へ動かす
            // （dragDelta=null になった後も元位置へ戻らないように）
            setDisplayLocale(newLocale);
            setDragDelta(null);
            switchLocale(newLocale);
        } else {
            setDragDelta(null);
        }
    };

    // ドラッグ中は px ベースの inline style、それ以外は Tailwind クラス
    const isDragging = dragDelta !== null;
    const knobStyle = isDragging
        ? {
              transform: `translateX(${(displayLocale === 'ja' ? 0 : (dragRef.current?.travel ?? 0)) + dragDelta}px)`,
              transition: 'none',
          }
        : undefined;

    return (
        <button
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative inline-flex h-8 items-center rounded-full border border-border bg-muted/70 p-0.5 text-[11px] font-mono tracking-wide transition-colors hover:border-border-hover select-none cursor-pointer"
            aria-label="Switch language"
        >
            <span
                style={knobStyle}
                className={[
                    'absolute top-0.5 bottom-0.5 w-[2.55rem] rounded-full border border-border bg-background',
                    !isDragging && 'transition-transform duration-300',
                    !isDragging && (displayLocale === 'ja' ? 'translate-x-0' : 'translate-x-[2.55rem]'),
                ].filter(Boolean).join(' ')}
                aria-hidden
            />
            <span
                className={`relative z-10 inline-flex w-[2.55rem] items-center justify-center transition-colors ${displayLocale === 'ja' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
                JA
            </span>
            <span
                className={`relative z-10 inline-flex w-[2.55rem] items-center justify-center transition-colors ${displayLocale === 'en' ? 'text-foreground' : 'text-muted-foreground'}`}
            >
                EN
            </span>
        </button>
    );
}
