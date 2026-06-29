'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { getLocaleMeta, getValidLocale, locales, type AppLocale } from '@/i18n/routing';
import { useSetAppLocale } from '@/i18n/LocaleProvider';

export function LanguageToggle() {
    const t = useTranslations('Language');
    const locale = getValidLocale(useLocale());
    const setAppLocale = useSetAppLocale();
    const menuId = useId();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [displayLocale, setDisplayLocale] = useState<AppLocale>(locale);
    const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);

    useEffect(() => {
        setDisplayLocale(locale);
        setPendingLocale(null);
        setIsOpen(false);
    }, [locale]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const activeIndex = locales.findIndex((code) => code === displayLocale);
        window.requestAnimationFrame(() => {
            optionRefs.current[activeIndex >= 0 ? activeIndex : 0]?.focus();
        });

        const handlePointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [displayLocale, isOpen]);

    const focusOption = (index: number) => {
        const total = locales.length;
        const nextIndex = (index + total) % total;
        optionRefs.current[nextIndex]?.focus();
    };

    const switchLocale = (nextLocale: AppLocale) => {
        if (nextLocale === displayLocale || pendingLocale !== null) {
            return;
        }

        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        if (locales.includes(pathSegments[0] as AppLocale)) {
            pathSegments.shift();
        }
        const localizedPathname = `/${nextLocale}${pathSegments.length ? `/${pathSegments.join('/')}` : ''}`;
        const localizedPath = `${localizedPathname}${window.location.search}${window.location.hash}`;

        setPendingLocale(nextLocale);
        setIsOpen(false);
        setDisplayLocale(nextLocale);
        setAppLocale(nextLocale);
        window.history.replaceState(window.history.state, '', localizedPath);
        window.requestAnimationFrame(() => {
            setPendingLocale(null);
        });
    };

    const currentLocaleMeta = getLocaleMeta(displayLocale);
    const isPending = pendingLocale !== null;

    return (
        <div
            ref={containerRef}
            className="locale-select relative"
            data-open={isOpen ? 'true' : 'false'}
            data-state={isPending ? 'pending' : 'idle'}
        >
            <button
                ref={buttonRef}
                type="button"
                className="locale-select__trigger"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={menuId}
                aria-label={`${t('label')}: ${currentLocaleMeta.label}`}
                onKeyDown={(event) => {
                    if (isPending) {
                        return;
                    }

                    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setIsOpen(true);
                    }
                }}
                onClick={() => {
                    if (isPending) {
                        return;
                    }
                    setIsOpen((open) => !open);
                }}
            >
                <span className="locale-select__trigger-icon" aria-hidden="true">
                    <Languages className="h-3.5 w-3.5" strokeWidth={1.65} />
                </span>
                <span className="locale-select__trigger-copy">
                    <span className="locale-select__trigger-label">{currentLocaleMeta.label}</span>
                    <span className="locale-select__trigger-code">{currentLocaleMeta.shortLabel}</span>
                </span>
                <ChevronDown
                    className={`locale-select__trigger-chevron h-3.5 w-3.5 ${isOpen ? 'rotate-180' : ''}`}
                    strokeWidth={1.7}
                    aria-hidden="true"
                />
            </button>

            <div
                id={menuId}
                role="menu"
                aria-label={t('label')}
                aria-hidden={!isOpen}
                className={`locale-select__menu ${isOpen ? 'locale-select__menu--open' : ''}`}
            >
                <div className="locale-select__menu-inner">
                    {locales.map((code, index) => {
                        const nextLocaleMeta = getLocaleMeta(code);
                        const isActive = displayLocale === code;
                        const isQueued = pendingLocale === code;

                        return (
                            <button
                                key={code}
                                ref={(node) => {
                                    optionRefs.current[index] = node;
                                }}
                                type="button"
                                role="menuitemradio"
                                aria-checked={isActive}
                                aria-label={t('switchTo', { language: nextLocaleMeta.label })}
                                className="locale-select__option"
                                disabled={isQueued}
                                onKeyDown={(event) => {
                                    if (event.key === 'ArrowDown') {
                                        event.preventDefault();
                                        focusOption(index + 1);
                                        return;
                                    }

                                    if (event.key === 'ArrowUp') {
                                        event.preventDefault();
                                        focusOption(index - 1);
                                        return;
                                    }

                                    if (event.key === 'Home') {
                                        event.preventDefault();
                                        focusOption(0);
                                        return;
                                    }

                                    if (event.key === 'End') {
                                        event.preventDefault();
                                        focusOption(locales.length - 1);
                                        return;
                                    }

                                    if (event.key === 'Escape') {
                                        event.preventDefault();
                                        setIsOpen(false);
                                        buttonRef.current?.focus();
                                    }
                                }}
                                onClick={() => {
                                    switchLocale(code);
                                }}
                            >
                                <span className="locale-select__option-copy">
                                    <span className="locale-select__option-name">{nextLocaleMeta.label}</span>
                                    <span className="locale-select__option-code">{nextLocaleMeta.shortLabel}</span>
                                </span>
                                <span className="locale-select__option-state" aria-hidden="true">
                                    {isActive ? (
                                        <Check className="h-3.5 w-3.5" strokeWidth={2} />
                                    ) : isQueued ? (
                                        <span className="locale-select__option-pending" />
                                    ) : null}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
