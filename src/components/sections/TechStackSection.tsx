'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

// Full-color brand logos, self-hosted under public/brands/stack (from svgl
// and devicon). Logos that are dark or light only ship a second file for the
// other theme (`hasDarkVariant`).
type TechItem = {
  name: string;
  logo: string;
  hasDarkVariant?: boolean;
  brandColor: string;
};

const stack = (slug: string) => `/brands/stack/${slug}.svg`;

const techStack: TechItem[] = [
  { name: 'TypeScript', logo: stack('typescript'), brandColor: '#3178C6' },
  { name: 'JavaScript', logo: stack('javascript'), brandColor: '#F7DF1E' },
  { name: 'Python', logo: stack('python'), brandColor: '#3776AB' },
  { name: 'PHP', logo: stack('php'), hasDarkVariant: true, brandColor: '#777BB4' },
  { name: 'Dart', logo: stack('dart'), brandColor: '#0175C2' },
  { name: 'HTML', logo: stack('html'), brandColor: '#E34F26' },
  { name: 'CSS', logo: stack('css'), brandColor: '#1572B6' },
  { name: 'Bash', logo: stack('bash'), hasDarkVariant: true, brandColor: '#4EAA25' },
  { name: 'React', logo: stack('react'), hasDarkVariant: true, brandColor: '#61DAFB' },
  { name: 'Next.js', logo: stack('nextjs'), brandColor: '#999999' },
  { name: 'Node.js', logo: stack('nodejs'), brandColor: '#5FA04E' },
  { name: 'Vite', logo: stack('vite'), brandColor: '#9135FF' },
  { name: 'Tailwind CSS', logo: stack('tailwindcss'), brandColor: '#06B6D4' },
  { name: 'Flutter', logo: stack('flutter'), brandColor: '#02569B' },
  { name: 'Appwrite', logo: stack('appwrite'), brandColor: '#FD366E' },
  { name: 'Supabase', logo: stack('supabase'), brandColor: '#3FCF8E' },
  { name: 'PostgreSQL', logo: stack('postgresql'), brandColor: '#4169E1' },
  { name: 'Docker', logo: stack('docker'), brandColor: '#2496ED' },
  { name: 'Dokploy', logo: stack('dokploy'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'Nginx', logo: stack('nginx'), brandColor: '#009639' },
  { name: 'Traefik', logo: stack('traefik'), brandColor: '#24A1C1' },
  { name: 'Cloudflare', logo: stack('cloudflare'), brandColor: '#F38020' },
  { name: 'Vercel', logo: stack('vercel'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'Oracle Cloud', logo: stack('oracle'), brandColor: '#F80000' },
  { name: 'Tailscale', logo: stack('tailscale'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'WireGuard', logo: stack('wireguard'), brandColor: '#88171A' },
  { name: 'Linux', logo: stack('linux'), brandColor: '#FCC624' },
  { name: 'Ubuntu', logo: stack('ubuntu'), brandColor: '#E95420' },
  { name: 'Debian', logo: stack('debian'), brandColor: '#A81D33' },
  { name: 'Raspberry Pi', logo: stack('raspberrypi'), brandColor: '#A22846' },
  { name: 'Git', logo: stack('git'), brandColor: '#F05032' },
  { name: 'GitHub', logo: stack('github'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'VS Code', logo: stack('vscode'), brandColor: '#007ACC' },
  { name: 'Cursor', logo: stack('cursor'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'Antigravity', logo: stack('antigravity'), brandColor: '#4285F4' },
  { name: 'Xcode', logo: stack('xcode'), brandColor: '#147EFB' },
  { name: 'Android Studio', logo: stack('androidstudio'), brandColor: '#3DDC84' },
  { name: 'Figma', logo: stack('figma'), brandColor: '#F24E1E' },
  { name: 'ChatGPT', logo: stack('openai'), hasDarkVariant: true, brandColor: '#10A37F' },
  { name: 'Claude', logo: stack('claude'), brandColor: '#D97757' },
  { name: 'Gemini', logo: stack('gemini'), brandColor: '#8E75B2' },
  { name: 'macOS', logo: stack('apple'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'Windows', logo: stack('windows'), brandColor: '#0078D4' },
  { name: 'Discord', logo: stack('discord'), brandColor: '#5865F2' },
  { name: 'Minecraft', logo: '/brands/minecraft.svg', brandColor: '#62B47A' },
];

function BrandLogo({ item }: { item: TechItem }) {
  const alt = `${item.name} logo`;
  if (!item.hasDarkVariant) {
    return <img src={item.logo} alt={alt} width={28} height={28} loading="lazy" className="h-7 w-7 object-contain" />;
  }
  const darkLogo = item.logo.replace(/\.svg$/, '-dark.svg');
  return (
    <>
      <img src={item.logo} alt={alt} width={28} height={28} loading="lazy" className="h-7 w-7 object-contain dark:hidden" />
      <img src={darkLogo} alt={alt} width={28} height={28} loading="lazy" className="hidden h-7 w-7 object-contain dark:block" />
    </>
  );
}

function TechCard({ item, idx, prefix }: { item: TechItem; idx: number; prefix: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      key={`${prefix}-${idx}`}
      className="tech-card group shrink-0 w-[104px] sm:w-[120px] transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderColor: isHovered && item.brandColor ? `${item.brandColor}40` : undefined,
        boxShadow: isHovered && item.brandColor ? `0 0 20px ${item.brandColor}15, inset 0 0 20px ${item.brandColor}08` : undefined,
      }}
    >
      <div className="relative flex flex-col items-center gap-3 py-5 px-4">
        <div className="tech-icon-wrapper">
          <BrandLogo item={item} />
        </div>
        <span
          className="text-[12px] font-mono text-muted-foreground transition-colors duration-300 text-center leading-tight whitespace-nowrap"
          style={{ color: isHovered && item.brandColor ? item.brandColor : undefined }}
        >
          {item.name}
        </span>
      </div>
    </div>
  );
}

export default function TechStackSection() {
  const t = useTranslations('TechStack');
  const split = Math.ceil(techStack.length / 2);
  const row1 = techStack.slice(0, split);
  const row2 = techStack.slice(split);

  return (
    <section id="tech-stack" className="py-10 sm:py-12 lg:py-16 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">{t('heading')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6">{t('subtitle')}</p>
        </ScrollReveal>
      </div>

      <div className="scroll-container mb-4">
        <div className="scroll-track scroll-left">
          {[...row1, ...row1].map((item, idx) => (
            <TechCard key={`r1-${idx}`} item={item} idx={idx} prefix="r1" />
          ))}
        </div>
      </div>

      <div className="scroll-container">
        <div className="scroll-track scroll-right">
          {[...row2, ...row2].map((item, idx) => (
            <TechCard key={`r2-${idx}`} item={item} idx={idx} prefix="r2" />
          ))}
        </div>
      </div>
    </section>
  );
}
