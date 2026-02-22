'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Github, Twitter, Mail } from 'lucide-react';

const socialLinks = [
    { icon: Github, href: 'https://github.com/AxAce67', label: 'GitHub' },
    { icon: Twitter, href: 'https://x.com/real_Aki', label: 'Twitter/X' },
    { icon: Mail, href: '', label: 'Email', disabled: true },
];

export function Footer() {
    const t = useTranslations('Footer');
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border">
            <div className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
                <div className="flex flex-col items-center gap-8">
                    {/* Brand */}
                    <p className="font-mono text-sm tracking-wide">
                        <span>Akiz</span>
                        <span className="text-[var(--accent-muted)]">.</span>
                    </p>

                    {/* Social */}
                    <div className="flex items-center gap-6">
                        {socialLinks.map(({ icon: Icon, href, label, disabled }) =>
                            disabled ? (
                                <span
                                    key={label}
                                    className="text-muted-foreground opacity-50 cursor-not-allowed"
                                    aria-label={`${label} (disabled)`}
                                >
                                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                                </span>
                            ) : (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-foreground/90 hover:text-foreground transition-colors duration-300"
                                    aria-label={label}
                                >
                                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                                </a>
                            )
                        )}
                    </div>

                    {/* Web Counter */}
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] font-mono text-muted-foreground tracking-wider">
                            Access
                        </p>
                        <Image
                            src="https://count.getloli.com/@portfolio_Aki?name=portfolio_Aki&theme=love-and-deepspace&padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=auto"
                            alt="Web counter"
                            width={142}
                            height={48}
                            unoptimized
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="h-12 w-auto max-w-[90vw]"
                        />
                    </div>

                    {/* Copyright */}
                    <p className="text-xs text-muted-foreground">
                        {t('copyright', { year: year.toString() })}
                    </p>
                </div>
            </div>
        </footer>
    );
}
