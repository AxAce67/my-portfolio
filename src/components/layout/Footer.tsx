'use client';

import { useTranslations } from '@/hooks/useTranslations';
import Image from '@/components/ui/Image';
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
        <footer className="relative mt-20 pb-10 pt-12 border-t border-border/40 bg-card">
            <div className="max-w-3xl mx-auto px-6 flex flex-col items-center gap-6">
                
                {/* 1. Social Icons */}
                <div className="flex items-center gap-8">
                    {socialLinks.map(({ icon: Icon, href, label, disabled }) =>
                        disabled ? (
                            <span
                                key={label}
                                className="text-muted-foreground/40 cursor-not-allowed"
                                title={label}
                                aria-hidden="true"
                            >
                                <Icon className="w-5 h-5" strokeWidth={1.5} />
                            </span>
                        ) : (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground/60 hover:text-foreground transition-all duration-300 hover:-translate-y-0.5"
                                aria-label={label}
                            >
                                <Icon className="w-5 h-5" strokeWidth={1.5} />
                            </a>
                        )
                    )}
                </div>

                {/* 2. Text & Legal Links */}
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs font-mono text-muted-foreground/60">
                    <p>&copy; {year} Aki.</p>
                    <span className="text-muted-foreground/30">✦</span>
                    <FadeLink href="/terms" variant="document" className="hover:text-foreground transition-colors">
                        {t('terms')}
                    </FadeLink>
                    <span className="text-muted-foreground/30">✦</span>
                    <FadeLink href="/license" variant="document" className="hover:text-foreground transition-colors">
                        {t('license')}
                    </FadeLink>
                </div>

                {/* 3. Subtle Counter */}
                <div className="mt-2 opacity-80 hover:opacity-100 transition-opacity duration-500 filter grayscale hover:grayscale-0">
                    <Image
                        src="https://count.getloli.com/@portfolio_Aki?name=portfolio_Aki&theme=3d-num&padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=auto"
                        alt="Web counter"
                        width={180}
                        height={60}
                        unoptimized
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-[84px] h-auto"
                    />
                </div>

            </div>
        </footer>
    );
}
