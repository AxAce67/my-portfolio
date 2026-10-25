'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { BrandLogo } from '@/components/ui/BrandLogo';

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
  { name: 'Swift', logo: stack('swift'), brandColor: '#F05138' },
  { name: 'Java', logo: stack('java'), brandColor: '#E76F00' },
  { name: 'SQL', logo: stack('sql'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'HTML', logo: stack('html'), brandColor: '#E34F26' },
  { name: 'CSS', logo: stack('css'), brandColor: '#1572B6' },
  { name: 'Bash', logo: stack('bash'), hasDarkVariant: true, brandColor: '#4EAA25' },
  { name: 'YAML', logo: stack('yaml'), brandColor: '#CB171E' },
  { name: 'Markdown', logo: stack('markdown'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'React', logo: stack('react'), hasDarkVariant: true, brandColor: '#61DAFB' },
  { name: 'Next.js', logo: stack('nextjs'), brandColor: '#999999' },
  { name: 'Astro', logo: stack('astro'), hasDarkVariant: true, brandColor: '#BC52EE' },
  { name: 'Node.js', logo: stack('nodejs'), brandColor: '#5FA04E' },
  { name: 'Vite', logo: stack('vite'), brandColor: '#9135FF' },
  { name: 'Tailwind CSS', logo: stack('tailwindcss'), brandColor: '#06B6D4' },
  { name: 'Three.js', logo: stack('threejs'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'Framer Motion', logo: stack('motion'), hasDarkVariant: true, brandColor: '#FFF312' },
  { name: 'BlockNote', logo: stack('blocknote'), brandColor: '#7C5CFC' },
  { name: 'Flutter', logo: stack('flutter'), brandColor: '#02569B' },
  { name: 'FastAPI', logo: stack('fastapi'), brandColor: '#009688' },
  { name: 'Flask', logo: stack('flask'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'Appwrite', logo: stack('appwrite'), brandColor: '#FD366E' },
  { name: 'Supabase', logo: stack('supabase'), brandColor: '#3FCF8E' },
  { name: 'PostgreSQL', logo: stack('postgresql'), brandColor: '#4169E1' },
  { name: 'MySQL', logo: stack('mysql'), hasDarkVariant: true, brandColor: '#4479A1' },
  { name: 'MariaDB', logo: stack('mariadb'), brandColor: '#C0765A' },
  { name: 'SQLite', logo: stack('sqlite'), brandColor: '#0F80CC' },
  { name: 'Redis', logo: stack('redis'), brandColor: '#FF4438' },
  { name: 'Docker', logo: stack('docker'), brandColor: '#2496ED' },
  { name: 'Dokploy', logo: stack('dokploy'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'Nginx', logo: stack('nginx'), brandColor: '#009639' },
  { name: 'Traefik', logo: stack('traefik'), brandColor: '#24A1C1' },
  { name: 'Cloudflare', logo: stack('cloudflare'), brandColor: '#F38020' },
  { name: 'Vercel', logo: stack('vercel'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'AWS', logo: stack('aws'), hasDarkVariant: true, brandColor: '#FF9900' },
  { name: 'Google Cloud', logo: stack('googlecloud'), brandColor: '#4285F4' },
  { name: 'Oracle Cloud', logo: stack('oracle'), brandColor: '#F80000' },
  { name: 'Contabo', logo: stack('contabo'), brandColor: '#00A6E0' },
  { name: 'Let\'s Encrypt', logo: stack('letsencrypt'), brandColor: '#FFA400' },
  { name: 'GitHub Actions', logo: stack('githubactions'), brandColor: '#2088FF' },
  { name: 'Tailscale', logo: stack('tailscale'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'WireGuard', logo: stack('wireguard'), brandColor: '#88171A' },
  { name: 'wg-easy', logo: '/brands/stack/wgeasy.png', brandColor: '#88171A' },
  { name: 'BIRD', logo: stack('bird'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'chrony', logo: stack('chrony'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'NSD', logo: stack('nsd'), brandColor: '#2F5BA7' },
  { name: 'Immich', logo: stack('immich'), brandColor: '#4250AF' },
  { name: 'Pterodactyl', logo: stack('pterodactyl'), brandColor: '#0E4688' },
  { name: 'Kener', logo: '/brands/stack/kener.png', brandColor: '#999999' },
  { name: 'Homarr', logo: stack('homarr'), brandColor: '#FA5252' },
  { name: 'Beszel', logo: stack('beszel'), brandColor: '#7C3AED' },
  { name: 'Umami', logo: stack('umami'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'Authentik', logo: stack('authentik'), brandColor: '#FD4B2D' },
  { name: 'Filestash', logo: stack('filestash'), brandColor: '#8BC4E3' },
  { name: 'OpenMediaVault', logo: stack('openmediavault'), brandColor: '#5DACDF' },
  { name: 'Linux', logo: stack('linux'), brandColor: '#FCC624' },
  { name: 'Ubuntu', logo: stack('ubuntu'), brandColor: '#E95420' },
  { name: 'Debian', logo: stack('debian'), brandColor: '#A81D33' },
  { name: 'Raspberry Pi', logo: stack('raspberrypi'), brandColor: '#A22846' },
  { name: 'macOS', logo: stack('apple'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'iOS', logo: stack('ios'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'Windows', logo: stack('windows'), brandColor: '#0078D4' },
  { name: 'Git', logo: stack('git'), brandColor: '#F05032' },
  { name: 'GitHub', logo: stack('github'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'npm', logo: stack('npm'), brandColor: '#CB3837' },
  { name: 'VS Code', logo: stack('vscode'), brandColor: '#007ACC' },
  { name: 'Cursor', logo: stack('cursor'), hasDarkVariant: true, brandColor: '#999999' },
  { name: 'Antigravity', logo: stack('antigravity'), brandColor: '#4285F4' },
  { name: 'JetBrains', logo: stack('jetbrains'), brandColor: '#999999' },
  { name: 'Xcode', logo: stack('xcode'), brandColor: '#147EFB' },
  { name: 'Android Studio', logo: stack('androidstudio'), brandColor: '#3DDC84' },
  { name: 'Figma', logo: stack('figma'), brandColor: '#F24E1E' },
  { name: 'Blender', logo: stack('blender'), brandColor: '#F5792A' },
  { name: 'ChatGPT', logo: stack('openai'), hasDarkVariant: true, brandColor: '#10A37F' },
  { name: 'Claude', logo: stack('claude'), brandColor: '#D97757' },
  { name: 'Gemini', logo: stack('gemini'), brandColor: '#8E75B2' },
  { name: 'Discord', logo: stack('discord'), brandColor: '#5865F2' },
  { name: 'Minecraft', logo: '/brands/minecraft.svg', brandColor: '#62B47A' },
];

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
          <BrandLogo src={item.logo} alt={`${item.name} logo`} size={28} hasDarkVariant={item.hasDarkVariant} className="h-7 w-7" />
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
  const rowSize = Math.ceil(techStack.length / 3);
  const rows = [0, 1, 2].map((row) => techStack.slice(row * rowSize, (row + 1) * rowSize));

  return (
    <section id="tech-stack" className="py-10 sm:py-12 lg:py-16 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">{t('heading')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-5 sm:mb-6">{t('subtitle')}</p>
        </ScrollReveal>
      </div>

      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className={`scroll-container ${rowIdx < rows.length - 1 ? 'mb-4' : ''}`}>
          <div
            className={`scroll-track ${rowIdx % 2 === 0 ? 'scroll-left' : 'scroll-right'}`}
            // Keep the same per-card speed however many items a row holds.
            style={{ animationDuration: `${row.length * 2.5}s` }}
          >
            {[...row, ...row].map((item, idx) => (
              <TechCard key={`r${rowIdx}-${idx}`} item={item} idx={idx} prefix={`r${rowIdx}`} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
