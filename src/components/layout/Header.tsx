'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, usePathname, useRouter } from '@/i18n/routing';

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
        <header
            className={`site-header fixed top-0 left-0 right-0 z-50 ${shouldShowSolidHeader ? 'is-scrolled' : ''}`}
        >
            <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    {/* Logo */}
                    <button
                        onClick={() => {
                            if (isHomePage) {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                                router.push('/');
                            }
                        }}
                        className="font-mono text-sm font-medium tracking-wide hover:opacity-60 transition-opacity"
                    >
                        <span>Akiz</span>
                        <span className="text-[var(--accent-muted)]">.</span>
                    </button>

                    {/* Desktop Nav */}
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
                                <Link
                                    key={item}
                                    href={`/#${sectionIds[item]}`}
                                    className="nav-link text-[13px] tracking-wide uppercase transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    {t(item)}
                                </Link>
                            )
                        )}
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        <LanguageToggle />
                        <ThemeToggle />
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2.5 rounded-lg hover:bg-muted transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden fixed inset-0 top-14 sm:top-16 z-40"
                    >
                        <div
                            className="absolute inset-0 bg-background/98 backdrop-blur-xl"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <nav className="relative z-50 px-6 sm:px-8 pt-10 sm:pt-12">
                            <div className="w-full max-w-md rounded-2xl border border-border-hover bg-card p-4 sm:p-5 space-y-1 shadow-[0_20px_44px_-20px_rgba(0,0,0,0.55)]">
                                {navItems.map((item, index) => (
                                    <motion.button
                                        key={item}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.08, duration: 0.3 }}
                                        onClick={() => {
                                            if (isHomePage) {
                                                scrollToSection(sectionIds[item]);
                                            } else {
                                                router.push(`/#${sectionIds[item]}`);
                                                setIsMenuOpen(false);
                                            }
                                        }}
                                        className="w-full text-left text-lg sm:text-xl font-light tracking-wide px-2 py-3 text-foreground/90 hover:text-foreground transition-colors"
                                    >
                                        {t(item)}
                                    </motion.button>
                                ))}
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
