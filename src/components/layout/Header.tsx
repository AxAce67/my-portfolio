'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { usePathname, useRouter } from '@/i18n/routing';
import { runRouteTransition } from '@/lib/viewTransitions';
import { clearProjectReturnState } from '@/lib/navigationState';

const navItems = ['about', 'skills', 'technologies', 'projects', 'timeline', 'contact'] as const;

const sectionIds: Record<string, string> = {
    about: 'about',
    skills: 'skills',
    technologies: 'tech-stack',
    projects: 'projects',
    timeline: 'timeline',
    contact: 'contact',
};

export function Header() {
    const t = useTranslations('Navigation');
    const pathname = usePathname();
    const router = useRouter();
    const isHomePage = pathname === '/';
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const shouldShowSolidHeader = scrolled || !isHomePage;

    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isMenuOpen) {
            document.body.style.removeProperty('overflow');
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMenuOpen]);

    useEffect(() => {
        if (!isHomePage) {
            setActiveSection('');
            const handleScrollOnly = () => setScrolled(window.scrollY > 20);
            window.addEventListener('scroll', handleScrollOnly, { passive: true });
            handleScrollOnly();
            return () => {
                window.removeEventListener('scroll', handleScrollOnly);
            };
        }

        const handleScroll = () => setScrolled(window.scrollY > 20);
        const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]'));
        const visibleSections = new Map<string, number>();

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const id = (entry.target as HTMLElement).id;
                    if (entry.isIntersecting) {
                        visibleSections.set(id, entry.boundingClientRect.top);
                    } else {
                        visibleSections.delete(id);
                    }
                });

                if (window.scrollY < 40) {
                    setActiveSection('');
                    return;
                }

                const nextSection = Array.from(visibleSections.entries())
                    .sort((left, right) => Math.abs(left[1]) - Math.abs(right[1]))[0]?.[0] ?? '';
                setActiveSection(nextSection);
            },
            {
                rootMargin: '-20% 0px -55% 0px',
                threshold: [0, 0.2, 0.5, 1],
            }
        );

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        sections.forEach((section) => observer.observe(section));

        return () => {
            window.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, [isHomePage]);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setIsMenuOpen(false);
        }
    };

    return (
        <>
            <header
                className={`site-header fixed top-0 left-0 right-0 z-50 ${shouldShowSolidHeader ? 'is-scrolled' : ''}`}
            >
                <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        {/* Logo */}
                        <button
                            onClick={() => {
                                if (isHomePage) {
                                    clearProjectReturnState();
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                } else {
                                    clearProjectReturnState();
                                    runRouteTransition(() => {
                                        router.push('/');
                                    }, { direction: 'backward' });
                                }
                            }}
                            className="font-mono text-sm font-medium tracking-wide hover:opacity-60 transition-opacity"
                        >
                            <span>Akiz</span>
                            <span className="text-[var(--accent-muted)]">.</span>
                        </button>

                        <div className="hidden md:flex items-center gap-8">
                            {navItems.map((item) =>
                                isHomePage ? (
                                    <button
                                        key={item}
                                        onClick={() => scrollToSection(sectionIds[item])}
                                        className={`nav-link text-[13px] tracking-wide uppercase transition-colors ${activeSection === sectionIds[item]
                                            ? 'text-foreground active'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {t(item)}
                                    </button>
                                ) : (
                                    <TransitionLink
                                        key={item}
                                        href={`/#${sectionIds[item]}`}
                                        direction="backward"
                                        onClick={() => {
                                            clearProjectReturnState();
                                        }}
                                        className="nav-link text-[13px] tracking-wide uppercase transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        {t(item)}
                                    </TransitionLink>
                                )
                            )}
                        </div>

                        <div className="flex items-center gap-0.5 sm:gap-1">
                            <LanguageToggle />
                            <ThemeToggle />
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2.5 rounded-lg hover:bg-muted transition-colors"
                                aria-label="Toggle menu"
                                aria-expanded={isMenuOpen}
                                aria-controls="mobile-site-menu"
                            >
                                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </nav>
            </header>

            {isMenuOpen ? (
                <div id="mobile-site-menu" className="mobile-nav-sheet md:hidden">
                    <button
                        type="button"
                        className="mobile-nav-sheet__backdrop"
                        aria-label="Close menu"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <nav className="mobile-nav-sheet__scroll" aria-label="Mobile navigation">
                        <div className="mobile-nav-sheet__panel">
                            {navItems.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => {
                                        if (isHomePage) {
                                            scrollToSection(sectionIds[item]);
                                        } else {
                                            clearProjectReturnState();
                                            runRouteTransition(() => {
                                                router.push(`/#${sectionIds[item]}`);
                                            }, { direction: 'backward' });
                                            setIsMenuOpen(false);
                                        }
                                    }}
                                    className="block w-full rounded-xl px-3 py-3 text-left text-lg font-light tracking-wide text-foreground/90 hover:bg-muted/70 hover:text-foreground transition-colors"
                                >
                                    {t(item)}
                                </button>
                            ))}
                        </div>
                    </nav>
                </div>
            ) : null}
        </>
    );
}
