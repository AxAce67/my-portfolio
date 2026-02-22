'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

export function LanguageToggle() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [displayLocale, setDisplayLocale] = useState<'ja' | 'en'>(locale === 'en' ? 'en' : 'ja');
    const [isSwitching, setIsSwitching] = useState(false);
    const switchTimerRef = useRef<number | null>(null);

    useEffect(() => {
        setDisplayLocale(locale === 'en' ? 'en' : 'ja');
        setIsSwitching(false);
    }, [locale]);

    useEffect(() => {
        return () => {
            if (switchTimerRef.current !== null) {
                window.clearTimeout(switchTimerRef.current);
            }
        };
    }, []);

    const toggleLocale = () => {
        if (isSwitching) return;
        const newLocale = displayLocale === 'ja' ? 'en' : 'ja';
        setDisplayLocale(newLocale);
        setIsSwitching(true);

        switchTimerRef.current = window.setTimeout(() => {
            router.replace(pathname, { locale: newLocale });
        }, 180);
    };

    return (
        <button
            onClick={toggleLocale}
            disabled={isSwitching}
            className="relative inline-flex h-8 items-center rounded-full border border-border bg-muted/70 p-0.5 text-[11px] font-mono tracking-wide transition-colors hover:border-border-hover"
            aria-label="Switch language"
        >
            <span
                className={`absolute top-0.5 bottom-0.5 w-[2.55rem] rounded-full border border-border bg-background transition-transform duration-300 ${displayLocale === 'ja' ? 'translate-x-0' : 'translate-x-[2.55rem]'
                    }`}
                aria-hidden
            />

            <span
                className={`relative z-10 inline-flex w-[2.55rem] items-center justify-center transition-colors ${displayLocale === 'ja' ? 'text-foreground' : 'text-muted-foreground'
                    }`}
            >
                JA
            </span>
            <span
                className={`relative z-10 inline-flex w-[2.55rem] items-center justify-center transition-colors ${displayLocale === 'en' ? 'text-foreground' : 'text-muted-foreground'
                    }`}
            >
                EN
            </span>
        </button>
    );
}
