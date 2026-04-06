'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { getLocaleMeta, getValidLocale, locales, type AppLocale } from '@/i18n/routing';
import { navigationStateKeys, readSessionValue, removeSessionValue, writeSessionValue } from '@/lib/navigationState';

const LOCALE_SWITCH_PENDING_CLASS = 'locale-switch-pending';
const LOCALE_SWITCH_ENTER_CLASS = 'locale-switch-enter';
const LOCALE_DIRECTION_VAR = '--locale-direction';
const LOCALE_OVERLAY_BG_VAR = '--locale-overlay-background-rgb';
const LOCALE_OVERLAY_ACCENT_VAR = '--locale-overlay-accent-rgb';
const LOCALE_OVERLAY_GLOW_VAR = '--locale-overlay-glow-rgb';
const THEME_LOCK_ATTRIBUTE = 'data-locale-theme-lock';
const FROZEN_THEME_VARS = [
    '--background',
    '--background-rgb',
    '--foreground',
    '--foreground-rgb',
    '--muted',
    '--muted-foreground',
    '--card',
    '--card-foreground',
    '--border',
    '--border-hover',
    '--accent',
    '--accent-muted',
    '--hero-accent-rgb',
    '--hero-accent-soft-rgb',
    '--hero-glow-rgb',
    '--hero-title-from',
    '--hero-title-to',
    '--grid-color',
] as const;

function prefersCompactPointer() {
    return typeof window !== 'undefined'
        && window.matchMedia('(pointer: coarse), (any-pointer: coarse)').matches;
}

export function LanguageToggle() {
    const t = useTranslations('Language');
    const locale = getValidLocale(useLocale());
    const pathname = usePathname();
    const router = useRouter();
    const menuId = useId();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const enterTimerRef = useRef<number | null>(null);
    const themeLockObserverRef = useRef<MutationObserver | null>(null);
    const themeLockClassRef = useRef<'light' | 'dark' | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [displayLocale, setDisplayLocale] = useState<AppLocale>(locale);
    const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);
    const displayLocaleIndex = locales.indexOf(displayLocale);

    const releaseThemeLock = () => {
        themeLockObserverRef.current?.disconnect();
        themeLockObserverRef.current = null;
        themeLockClassRef.current = null;
        document.documentElement.removeAttribute(THEME_LOCK_ATTRIBUTE);
    };

    const syncLockedThemeClass = () => {
        const lockedTheme = themeLockClassRef.current;
        if (!lockedTheme) {
            return;
        }

        const root = document.documentElement;
        const oppositeTheme = lockedTheme === 'light' ? 'dark' : 'light';
        if (root.classList.contains(oppositeTheme)) {
            root.classList.remove(oppositeTheme);
        }
        if (!root.classList.contains(lockedTheme)) {
            root.classList.add(lockedTheme);
        }
    };

    const startThemeLock = () => {
        releaseThemeLock();
        const root = document.documentElement;
        const lockedTheme = root.classList.contains('light') ? 'light' : 'dark';
        themeLockClassRef.current = lockedTheme;
        root.setAttribute(THEME_LOCK_ATTRIBUTE, lockedTheme);
        syncLockedThemeClass();
        themeLockObserverRef.current = new MutationObserver(() => {
            syncLockedThemeClass();
        });
        themeLockObserverRef.current.observe(root, {
            attributes: true,
            attributeFilter: ['class'],
        });
    };

    useEffect(() => {
        const root = document.documentElement;
        const hadPendingSwitch = root.classList.contains(LOCALE_SWITCH_PENDING_CLASS);
        root.classList.remove(LOCALE_SWITCH_PENDING_CLASS);
        root.style.removeProperty(LOCALE_DIRECTION_VAR);
        setDisplayLocale(locale);
        setPendingLocale(null);
        setIsOpen(false);

        if (hadPendingSwitch) {
            root.classList.add(LOCALE_SWITCH_ENTER_CLASS);
            if (enterTimerRef.current !== null) {
                window.clearTimeout(enterTimerRef.current);
            }
            enterTimerRef.current = window.setTimeout(() => {
                root.classList.remove(LOCALE_SWITCH_ENTER_CLASS);
                root.style.removeProperty(LOCALE_OVERLAY_BG_VAR);
                root.style.removeProperty(LOCALE_OVERLAY_ACCENT_VAR);
                root.style.removeProperty(LOCALE_OVERLAY_GLOW_VAR);
                FROZEN_THEME_VARS.forEach((variableName) => {
                    root.style.removeProperty(variableName);
                });
                root.style.removeProperty('color-scheme');
                releaseThemeLock();
                enterTimerRef.current = null;
            }, 220);
        } else {
            releaseThemeLock();
        }

        const savedScroll = readSessionValue(navigationStateKeys.languageScrollY);
        if (savedScroll && hadPendingSwitch) {
            removeSessionValue(navigationStateKeys.languageScrollY);
            window.requestAnimationFrame(() => {
                window.scrollTo({ top: Number.parseInt(savedScroll, 10) || 0, behavior: 'auto' });
            });
        }

        return () => {
            if (enterTimerRef.current !== null) {
                window.clearTimeout(enterTimerRef.current);
                enterTimerRef.current = null;
            }
            root.classList.remove(LOCALE_SWITCH_ENTER_CLASS);
        };
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

    useEffect(() => {
        return () => {
            if (enterTimerRef.current !== null) {
                window.clearTimeout(enterTimerRef.current);
            }
            if (!document.documentElement.classList.contains(LOCALE_SWITCH_PENDING_CLASS)) {
                releaseThemeLock();
            }
        };
    }, []);

    const prefetchLocale = (nextLocale: AppLocale) => {
        if (nextLocale === displayLocale) {
            return;
        }

        const localizedPath = `/${nextLocale}${pathname === '/' ? '' : pathname}`;
        router.prefetch(localizedPath);
    };

    const focusOption = (index: number) => {
        const total = locales.length;
        const nextIndex = (index + total) % total;
        optionRefs.current[nextIndex]?.focus();
    };

    const switchLocale = (nextLocale: AppLocale) => {
        if (nextLocale === displayLocale || pendingLocale !== null) {
            return;
        }

        const localizedPath = `/${nextLocale}${pathname === '/' ? '' : pathname}`;
        const compactPointer = prefersCompactPointer();
        const root = document.documentElement;
        const rootStyles = window.getComputedStyle(root);

        if (compactPointer) {
            setPendingLocale(nextLocale);
            setIsOpen(false);
            router.replace(localizedPath, {
                scroll: false,
            });
            return;
        }

        FROZEN_THEME_VARS.forEach((variableName) => {
            root.style.setProperty(variableName, rootStyles.getPropertyValue(variableName).trim());
        });
        root.style.setProperty(
            LOCALE_OVERLAY_BG_VAR,
            rootStyles.getPropertyValue('--background-rgb').trim() || '10 10 10',
        );
        root.style.setProperty(
            LOCALE_OVERLAY_ACCENT_VAR,
            rootStyles.getPropertyValue('--hero-accent-rgb').trim() || '122 188 255',
        );
        root.style.setProperty(
            LOCALE_OVERLAY_GLOW_VAR,
            rootStyles.getPropertyValue('--hero-glow-rgb').trim() || '200 220 255',
        );
        root.style.setProperty('color-scheme', rootStyles.colorScheme || 'dark');

        startThemeLock();
        writeSessionValue(navigationStateKeys.languageScrollY, String(window.scrollY));
        setPendingLocale(nextLocale);
        setIsOpen(false);
        root.classList.remove(LOCALE_SWITCH_ENTER_CLASS);
        root.classList.add(LOCALE_SWITCH_PENDING_CLASS);
        root.style.setProperty(LOCALE_DIRECTION_VAR, locales.indexOf(nextLocale) > displayLocaleIndex ? '1' : '-1');
        router.replace(localizedPath, {
            scroll: false,
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
                                onMouseEnter={() => prefetchLocale(code)}
                                onFocus={() => prefetchLocale(code)}
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
