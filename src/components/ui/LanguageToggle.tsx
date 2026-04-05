'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { runViewTransition } from '@/lib/viewTransitions';
import { navigationStateKeys, readSessionValue, removeSessionValue, writeSessionValue } from '@/lib/navigationState';

export function LanguageToggle() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [displayLocale, setDisplayLocale] = useState<'ja' | 'en'>(locale === 'en' ? 'en' : 'ja');
    const [pendingLocale, setPendingLocale] = useState<'ja' | 'en' | null>(null);

    useEffect(() => {
        setDisplayLocale(locale === 'en' ? 'en' : 'ja');
        setPendingLocale(null);

        const savedScroll = readSessionValue(navigationStateKeys.languageScrollY);
        if (!savedScroll) {
            return;
        }

        removeSessionValue(navigationStateKeys.languageScrollY);
        window.requestAnimationFrame(() => {
            window.scrollTo({ top: Number.parseInt(savedScroll, 10) || 0, behavior: 'auto' });
        });
    }, [locale]);

    const activeLocale = pendingLocale ?? displayLocale;
    const indicatorClassName = useMemo(
        () => [
            'absolute inset-y-0.5 left-0.5 w-[2.85rem] rounded-full border border-border/70 bg-background shadow-[0_8px_18px_-12px_rgba(0,0,0,0.55)]',
            'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            activeLocale === 'ja' ? 'translate-x-0' : 'translate-x-[2.85rem]',
        ].join(' '),
        [activeLocale],
    );

    const switchLocale = (nextLocale: 'ja' | 'en') => {
        if (nextLocale === displayLocale || isPending) {
            return;
        }

        writeSessionValue(navigationStateKeys.languageScrollY, String(window.scrollY));
        setPendingLocale(nextLocale);

        runViewTransition(() => {
            startTransition(() => {
                router.replace(pathname, { locale: nextLocale, scroll: false });
            });
        });
    };

    return (
        <div
            className="relative inline-flex h-8 items-center rounded-full border border-border bg-muted/70 p-0.5 text-[11px] font-mono tracking-[0.18em]"
            role="group"
            aria-label="Switch language"
            aria-busy={isPending}
        >
            <span className={indicatorClassName} aria-hidden="true" />
            {(['ja', 'en'] as const).map((code) => (
                <button
                    key={code}
                    type="button"
                    onClick={() => switchLocale(code)}
                    disabled={isPending && pendingLocale === code}
                    className={`relative z-10 inline-flex h-full w-[2.85rem] items-center justify-center rounded-full transition-colors ${
                        activeLocale === code ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-pressed={activeLocale === code}
                    aria-label={code === 'ja' ? 'Switch language to Japanese' : 'Switch language to English'}
                >
                    {code.toUpperCase()}
                </button>
            ))}
        </div>
    );
}
