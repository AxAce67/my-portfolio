'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Github, Twitter, Mail } from 'lucide-react';
import { FadeLink } from '@/components/ui/FadeLink';

const socialLinks = [
    { icon: Github, href: 'https://github.com/AxAce67', label: 'GitHub' },
    { icon: Twitter, href: 'https://x.com/real_Aki', label: 'X' },
    { icon: Mail, href: '', label: 'Email', disabled: true },
];

export function Footer() {
    const t = useTranslations('Footer');
    const year = new Date().getFullYear();

    return (
        <footer className="footer-container">
            <div className="footer-gradient-border" />

            <div className="footer-inner">
                <div className="footer-minimal-center">
                    <div className="footer-brand-copy">
                        <p className="footer-brand-name">
                            <span>Akiz</span>
                            <span className="footer-brand-dot">.</span>
                        </p>
                        <p className="footer-tagline">{t('tagline')}</p>
                    </div>

                    <div className="footer-social-row">
                        {socialLinks.map(({ icon: Icon, href, label, disabled }) => (
                            disabled ? (
                                <span key={label} className="footer-social-icon footer-social-icon--disabled" title={label}>
                                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                                </span>
                            ) : (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="footer-social-icon"
                                    title={label}
                                    aria-label={label}
                                >
                                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                                </a>
                            )
                        ))}
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

                <div className="footer-bottom">
                    <p className="footer-copyright">
                        {t('copyright', { year: year.toString() })}
                    </p>
                    <div className="footer-bottom-row">
                        <FadeLink
                            href="/terms"
                            className="footer-legal-link"
                        >
                            {t('terms')}
                        </FadeLink>
                        <FadeLink
                            href="/license"
                            className="footer-legal-link"
                        >
                            {t('license')}
                        </FadeLink>
                    </div>
                </div>
            </div>
        </footer>
    );
}
