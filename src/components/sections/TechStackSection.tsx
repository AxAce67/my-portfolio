'use client';

import { useState } from 'react';
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
type IconComponent = ComponentType<{ size?: number | string; className?: string }>;
type TechItem =
  | { name: string; icon: IconComponent; iconSrc?: never; fallbackIcon?: never }
  | { name: string; iconSrc: string; fallbackIcon: IconComponent; icon?: never };

function BrandIcon({ item }: { item: TechItem }) {
  const [imageFailed, setImageFailed] = useState(false);

  if ('iconSrc' in item && !imageFailed) {
    return (
      <Image
        src={item.iconSrc}
        alt={`${item.name} logo`}
        width={28}
        height={28}
        className="w-7 h-7 object-contain grayscale contrast-150 brightness-75 dark:brightness-125 dark:invert"
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    );
  }
  if (item.iconSrc) {
    const Fallback = item.fallbackIcon!;
    return <Fallback size={28} className="transition-all duration-300 text-muted-foreground group-hover:text-foreground" />;
  }
  const Fallback = item.icon!;
  return <Fallback size={28} className="transition-all duration-300 text-muted-foreground group-hover:text-foreground" />;
}

const AntigravityLogo: IconComponent = ({ size = 28, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="currentColor"
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <path d="m19.94,20.59c1.09.82,2.73.27,1.23-1.23-4.5-4.36-3.55-16.36-9.14-16.36S7.39,15,2.89,19.36c-1.64,1.64.14,2.05,1.23,1.23,4.23-2.86,3.95-7.91,7.91-7.91s3.68,5.05,7.91,7.91Z" />
  </svg>
);

const techStack: TechItem[] = [
  { name: 'Apple', icon: SiApple },
  { name: 'Windows', icon: FaWindows },
  { name: 'Linux', icon: SiLinux },
  { name: 'Ubuntu', icon: SiUbuntu },
  { name: 'Git', icon: SiGit },
  { name: 'GitHub', icon: SiGithub },
  { name: 'Next.js', icon: SiNextdotjs },
  { name: 'TypeScript', icon: SiTypescript },
  { name: 'JavaScript', icon: SiJavascript },
  { name: 'React', icon: SiReact },
  { name: 'Node.js', icon: SiNodedotjs },
  { name: 'HTML', icon: SiHtml5 },
  { name: 'CSS', icon: SiCss },
  { name: 'PHP', icon: SiPhp },
  { name: 'Tailwind CSS', icon: SiTailwindcss },
  { name: 'Supabase', icon: SiSupabase },
  { name: 'Vercel', icon: SiVercel },
  { name: 'Cloudflare', icon: SiCloudflare },
  { name: 'Nginx', icon: SiNginx },
  { name: 'PostgreSQL', icon: SiPostgresql },
  { name: 'Docker', icon: SiDocker },
  { name: 'Python', icon: SiPython },
  { name: 'Discord', icon: SiDiscord },
  { name: 'Raspberry Pi', icon: SiRaspberrypi },
  { name: 'Minecraft', iconSrc: '/brands/minecraft.svg', fallbackIcon: FaCube },
  { name: 'Figma', icon: SiFigma },
  { name: 'ChatGPT', icon: SiOpenai },
  { name: 'Claude Code', icon: SiClaude },
  { name: 'Gemini', icon: SiGooglegemini },
  { name: 'VS Code', iconSrc: '/brands/visual-studio-code.svg', fallbackIcon: SiVscodium },
  { name: 'Cursor', icon: SiCursor },
  { name: 'Antigravity', icon: AntigravityLogo },
  { name: 'Xcode', icon: SiXcode },
  { name: 'Android Studio', icon: SiAndroidstudio },
];

export default function TechStackSection() {
  const split = Math.ceil(techStack.length / 2);
  const row1 = techStack.slice(0, split);
  const row2 = techStack.slice(split);

  return (
    <section id="tech-stack" className="py-20 sm:py-32 lg:py-36 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <p className="section-label text-center">{'// tech_stack'}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2 text-center">Technologies &amp; Services</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-8 sm:mb-12 text-center">日常的に利用している技術・サービス一覧</p>
        </ScrollReveal>
      </div>

      <div className="scroll-container mb-4">
        <div className="scroll-track scroll-left">
          {[...row1, ...row1, ...row1].map((item, idx) => (
            <div key={`r1-${idx}`} className="tech-card group flex-shrink-0 w-[104px] sm:w-[120px]">
              <div className="relative flex flex-col items-center gap-3 py-5 px-4">
                <div className="tech-icon-wrapper">
                  <BrandIcon item={item} />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight whitespace-nowrap">
                  {item.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="scroll-container">
        <div className="scroll-track scroll-right">
          {[...row2, ...row2, ...row2].map((item, idx) => (
            <div key={`r2-${idx}`} className="tech-card group flex-shrink-0 w-[104px] sm:w-[120px]">
              <div className="relative flex flex-col items-center gap-3 py-5 px-4">
                <div className="tech-icon-wrapper">
                  <BrandIcon item={item} />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight whitespace-nowrap">
                  {item.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
