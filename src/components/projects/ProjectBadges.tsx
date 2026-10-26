'use client';

import { useTranslations } from '@/hooks/useTranslations';
import { useRouter } from '@/i18n/routing';
import { PROJECT_STATUS_BADGE_CLASS, isProjectStatus } from '@/lib/projectStatus';
import type { ProjectKind } from '@/lib/content/publicContent';

const BADGE = 'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-medium';

/** Status badge ("Running", "In development", …), then a "Service" badge for services; tags follow. */
export function ProjectBadges({ kind, status, className = '' }: { kind: ProjectKind; status: string | null; className?: string }) {
  const t = useTranslations('ProjectStatus');
  const tKind = useTranslations('ProjectKind');
  if (kind !== 'service' && !isProjectStatus(status)) return null;
  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {isProjectStatus(status) && <span className={`${BADGE} ${PROJECT_STATUS_BADGE_CLASS[status]}`}>{t(status)}</span>}
      {kind === 'service' && (
        <span className={`${BADGE} bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25`}>{tKind('service')}</span>
      )}
    </span>
  );
}

/**
 * A tag that narrows the project archive to that tag. Cards are links, so the
 * click is kept from also opening the project.
 */
export function TagChip({ tag, onSelect, className = '' }: { tag: string; onSelect?: (tag: string) => void; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (onSelect) onSelect(tag);
        else router.push(`/projects?tag=${encodeURIComponent(tag)}`);
      }}
      className={`text-[10px] sm:text-[11px] font-mono text-muted-foreground bg-muted px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-sm hover:text-foreground hover:bg-muted/70 transition-colors ${className}`}
    >
      {tag}
    </button>
  );
}
