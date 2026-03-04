'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Github, Twitter, Mail } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';

const socialLinks = [
    { icon: Github, href: 'https://github.com/AxAce67', label: 'GitHub' },
    { icon: Twitter, href: 'https://x.com/real_Aki', label: 'X' },
    { icon: Mail, href: '', label: 'Email', disabled: true },
];

export function Footer() {
    const t = useTranslations('Footer');
    const router = useRouter();
    const year = new Date().getFullYear();

    const handleLegalClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            router.push(href);
            return;
        }

        document.documentElement.classList.add('lang-switching-out');
        setTimeout(() => {
            router.push(href);
        }, 300);
    };

    return (
        <footer className="footer-container">
            <div className="footer-gradient-border" />

            <div className="footer-inner">
                {/* Top section: brand + social */}
                <div className="footer-top">
                    <div className="footer-brand-center">
                        <p className="footer-brand-name">
                            <span>Akiz</span>
                            <span className="footer-brand-dot">.</span>
                        </p>
                        <p className="footer-tagline">
                            {t('tagline')}
                        </p>
                    </div>

                    {/* Social icons row */}
                    <div className="footer-social-row">
                        {socialLinks.map(({ icon: Icon, href, label, disabled }) => (
                            disabled ? (
                                <span key={label} className="footer-social-icon footer-social-icon--disabled" title={label}>
                                    <Icon className="w-4 h-4" strokeWidth={1.5} />
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
                                </a>
                            )
                        ))}
                    </div>
                </div>

                {/* Access counter */}
                <div className="footer-counter">
                    <Image
                        src="https://count.getloli.com/@portfolio_Aki?name=portfolio_Aki&theme=love-and-deepspace&padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=auto"
                        alt="Web counter"
                        width={142}
                        height={48}
                        unoptimized
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-8 w-auto"
                    />
                </div>

                {/* Bottom bar */}
                <div className="footer-bottom">
                    <p className="footer-made">{t('madeWith')}</p>
                    <div className="footer-bottom-row">
                        <p className="footer-copyright">
                            {t('copyright', { year: year.toString() })}
                        </p>
                        <span className="footer-dot-sep">·</span>
                        <Link
                            href="/terms"
                            className="footer-legal-link"
                            onClick={(e) => handleLegalClick(e, '/terms')}
                        >
                            {t('terms')}
                        </Link>
                        <span className="footer-dot-sep">·</span>
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
