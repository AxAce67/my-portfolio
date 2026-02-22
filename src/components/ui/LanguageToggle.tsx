'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const visibleLabel = locale === 'ja' ? 'EN' : 'JA';

    const toggleLocale = () => {
        const newLocale = locale === 'ja' ? 'en' : 'ja';
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`${visibleLabel} - Switch language`}
        >
            <Globe className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-[11px] font-mono tracking-wider">
                {visibleLabel}
            </span>
        </button>
    );
}
