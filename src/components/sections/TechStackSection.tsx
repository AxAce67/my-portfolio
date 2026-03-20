'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ComponentType } from 'react';
import Image from 'next/image';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import {
  SiApple,
  SiLinux,
  SiUbuntu,
  SiGit,
  SiGithub,
  SiCloudflare,
  SiNginx,
  SiRaspberrypi,
  SiNextdotjs,
  SiTypescript,
  SiJavascript,
  SiSupabase,
  SiVercel,
  SiPython,
  SiDiscord,
  SiHtml5,
  SiCss,
  SiPhp,
  SiTailwindcss,
  SiFigma,
  SiReact,
  SiNodedotjs,
  SiPostgresql,
  SiDocker,
  SiClaude,
  SiGooglegemini,
  SiCursor,
  SiVscodium,
  SiXcode,
  SiAndroidstudio,
} from '@icons-pack/react-simple-icons';
import { SiOpenai } from 'react-icons/si';
import { FaWindows, FaCube } from 'react-icons/fa';
type IconComponent = ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties }>;
type TechItem =
  | { name: string; icon: IconComponent; iconSrc?: never; fallbackIcon?: never; brandColor?: string }
  | { name: string; iconSrc: string; fallbackIcon: IconComponent; icon?: never; brandColor?: string };

function BrandIcon({ item, isHovered }: { item: TechItem; isHovered: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const iconSrc = 'iconSrc' in item ? item.iconSrc : undefined;
  const hoverStyle = isHovered && item.brandColor ? { color: item.brandColor } : {};

  if (typeof iconSrc === 'string' && !imageFailed) {
    return (
      <Image
        src={iconSrc}
        alt={`${item.name} logo`}
        width={28}
        height={28}
        className={`w-7 h-7 object-contain transition-all duration-300 ${isHovered ? '' : 'grayscale contrast-150 brightness-75 dark:brightness-125 dark:invert'
          }`}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    );
  }
  if (typeof iconSrc === 'string') {
    const Fallback = item.fallbackIcon!;
    return <Fallback size={28} className="transition-all duration-300" style={hoverStyle} />;
  }
  const Icon = item.icon!;
  return (
    <Icon
      size={28}
      className={`transition-all duration-300 ${isHovered ? '' : 'text-muted-foreground'}`}
      style={hoverStyle}
    />
  );
}

const AntigravityLogo: IconComponent = ({ size = 28, className = '', style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="currentColor"
    viewBox="0 0 24 24"
    className={className}
    style={style}
    aria-hidden="true"
  >
    <path d="m19.94,20.59c1.09.82,2.73.27,1.23-1.23-4.5-4.36-3.55-16.36-9.14-16.36S7.39,15,2.89,19.36c-1.64,1.64.14,2.05,1.23,1.23,4.23-2.86,3.95-7.91,7.91-7.91s3.68,5.05,7.91,7.91Z" />
  </svg>
);

const techStack: TechItem[] = [
  { name: 'Apple', icon: SiApple, brandColor: '#999999' },
  { name: 'Windows', icon: FaWindows, brandColor: '#0078D4' },
  { name: 'Linux', icon: SiLinux, brandColor: '#FCC624' },
  { name: 'Ubuntu', icon: SiUbuntu, brandColor: '#E95420' },
  { name: 'Git', icon: SiGit, brandColor: '#F05032' },
  { name: 'GitHub', icon: SiGithub, brandColor: '#999999' },
  { name: 'Next.js', icon: SiNextdotjs, brandColor: '#999999' },
  { name: 'TypeScript', icon: SiTypescript, brandColor: '#3178C6' },
  { name: 'JavaScript', icon: SiJavascript, brandColor: '#F7DF1E' },
  { name: 'React', icon: SiReact, brandColor: '#61DAFB' },
  { name: 'Node.js', icon: SiNodedotjs, brandColor: '#5FA04E' },
  { name: 'HTML', icon: SiHtml5, brandColor: '#E34F26' },
  { name: 'CSS', icon: SiCss, brandColor: '#1572B6' },
  { name: 'PHP', icon: SiPhp, brandColor: '#777BB4' },
  { name: 'Tailwind CSS', icon: SiTailwindcss, brandColor: '#06B6D4' },
  { name: 'Supabase', icon: SiSupabase, brandColor: '#3FCF8E' },
  { name: 'Vercel', icon: SiVercel, brandColor: '#999999' },
  { name: 'Cloudflare', icon: SiCloudflare, brandColor: '#F38020' },
  { name: 'Nginx', icon: SiNginx, brandColor: '#009639' },
  { name: 'PostgreSQL', icon: SiPostgresql, brandColor: '#4169E1' },
  { name: 'Docker', icon: SiDocker, brandColor: '#2496ED' },
  { name: 'Python', icon: SiPython, brandColor: '#3776AB' },
  { name: 'Discord', icon: SiDiscord, brandColor: '#5865F2' },
  { name: 'Raspberry Pi', icon: SiRaspberrypi, brandColor: '#A22846' },
  { name: 'Minecraft', iconSrc: '/brands/minecraft.svg', fallbackIcon: FaCube, brandColor: '#62B47A' },
  { name: 'Figma', icon: SiFigma, brandColor: '#F24E1E' },
  { name: 'ChatGPT', icon: SiOpenai, brandColor: '#10A37F' },
  { name: 'Claude Code', icon: SiClaude, brandColor: '#D97757' },
  { name: 'Gemini', icon: SiGooglegemini, brandColor: '#8E75B2' },
  { name: 'VS Code', iconSrc: '/brands/visual-studio-code.svg', fallbackIcon: SiVscodium, brandColor: '#007ACC' },
  { name: 'Cursor', icon: SiCursor, brandColor: '#999999' },
  { name: 'Antigravity', icon: AntigravityLogo, brandColor: '#999999' },
  { name: 'Xcode', icon: SiXcode, brandColor: '#147EFB' },
  { name: 'Android Studio', icon: SiAndroidstudio, brandColor: '#3DDC84' },
];

function TechCard({ item, idx, prefix }: { item: TechItem; idx: number; prefix: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      key={`${prefix}-${idx}`}
      className="tech-card group flex-shrink-0 w-[104px] sm:w-[120px] transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderColor: isHovered && item.brandColor ? `${item.brandColor}40` : undefined,
        boxShadow: isHovered && item.brandColor ? `0 0 20px ${item.brandColor}15, inset 0 0 20px ${item.brandColor}08` : undefined,
      }}
    >
      <div className="relative flex flex-col items-center gap-3 py-5 px-4">
        <div className="tech-icon-wrapper">
          <BrandIcon item={item} isHovered={isHovered} />
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
    <section id="tech-stack" className="py-20 sm:py-32 lg:py-36 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <p className="section-label text-center">{t('sectionTitle')}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2 text-center">{t('heading')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-8 sm:mb-12 text-center">{t('subtitle')}</p>
        </ScrollReveal>
      </div>

      <div className="scroll-container mb-4">
        <div className="scroll-track scroll-left">
          {[...row1, ...row1, ...row1].map((item, idx) => (
            <TechCard key={`r1-${idx}`} item={item} idx={idx} prefix="r1" />
          ))}
        </div>
      </div>

      <div className="scroll-container">
        <div className="scroll-track scroll-right">
          {[...row2, ...row2, ...row2].map((item, idx) => (
            <TechCard key={`r2-${idx}`} item={item} idx={idx} prefix="r2" />
          ))}
        </div>
      </div>
    </section>
  );
}
