'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Github, Twitter, Mail } from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/routing';

const socialLinks = [
    { icon: Github, href: 'https://github.com/AxAce67', label: 'GitHub' },
    { icon: Twitter, href: 'https://x.com/real_Aki', label: 'X' },
    { icon: Mail, href: '', label: 'Email', disabled: true },
];

export function Footer() {
    const t = useTranslations('Footer');
    const router = useRouter();
    const pathname = usePathname();
    const navTimerRef = useRef<number | null>(null);
    const year = new Date().getFullYear();

    useEffect(() => {
        return () => {
            if (navTimerRef.current !== null) {
                window.clearTimeout(navTimerRef.current);
            }
        };
    }, []);

    const handleLegalClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();

        if (pathname === href) {
            document.documentElement.classList.remove('lang-switching-out');
            document.documentElement.classList.remove('lang-switching-in');
            return;
        }

        if (navTimerRef.current !== null) {
            window.clearTimeout(navTimerRef.current);
        }

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            router.push(href);
            return;
        }

        document.documentElement.classList.remove('lang-switching-in');
        document.documentElement.classList.add('lang-switching-out');
        navTimerRef.current = window.setTimeout(() => {
            router.push(href);
            navTimerRef.current = null;
        }, 140);
    };

    return (
        <footer className="footer-container">
            <div className="footer-gradient-border" />

            <div className="footer-inner">
                <div className="footer-grid">
                    <div className="footer-brand-panel">
                        <div className="footer-brand-copy">
                            <p className="footer-brand-name">
                                <span>Akiz</span>
                                <span className="footer-brand-dot">.</span>
                            </p>
                            <p className="footer-tagline">{t('tagline')}</p>
                        </div>
                        <div className="footer-counter">
                            <Image
                                src="https://count.getloli.com/@portfolio_Aki?name=portfolio_Aki&theme=love-and-deepspace&padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=auto"
                                alt="Web counter"
                                width={212}
                                height={72}
                                unoptimized
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                className="footer-counter-image"
                            />
                        </div>
                    </div>

                    <div className="footer-link-panel">
                        <div className="footer-section">
                            <p className="footer-section-label">{t('connect')}</p>
                            <div className="footer-social-row">
                                {socialLinks.map(({ icon: Icon, href, label, disabled }) => (
                                    disabled ? (
                                        <span key={label} className="footer-social-icon footer-social-icon--disabled" title={label}>
                                            <Icon className="w-4 h-4" strokeWidth={1.5} />
                                            <span>{label}</span>
                                        </span>
                                    ) : (
                                        <a
                                            key={label}
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="footer-social-icon"
                                            title={label}
                                        >
                                            <Icon className="w-4 h-4" strokeWidth={1.5} />
                                            <span>{label}</span>
                                        </a>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="footer-copyright">
                        {t('copyright', { year: year.toString() })}
                    </p>
                    <div className="footer-bottom-row">
                        <Link
                            href="/terms"
                            className="footer-legal-link"
                            onClick={(e) => handleLegalClick(e, '/terms')}
                        >
                            {t('terms')}
                        </Link>
                        <Link
                            href="/license"
                            className="footer-legal-link"
                            onClick={(e) => handleLegalClick(e, '/license')}
                        >
                            {t('license')}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
