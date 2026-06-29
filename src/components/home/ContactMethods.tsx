import { Mail, Twitter } from 'lucide-react';
import { SiDiscord } from '@icons-pack/react-simple-icons';
import { toast } from 'sonner';
import { useTranslations } from '@/hooks/useTranslations';

type ContactMethodsProps = {
  className?: string;
  thirdMethod?: 'form' | 'email';
};

export function ContactMethods({ className = '', thirdMethod = 'form' }: ContactMethodsProps) {
  const t = useTranslations('Contact');
  const contactEmail = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? process.env.VITE_CONTACT_EMAIL)?.trim();

  const copyDiscordUsername = () => {
    navigator.clipboard.writeText('@xaki67').then(() => toast.success(t('discordCopied')));
  };

  const scrollToContactForm = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const itemClass =
    'group flex min-w-0 items-center gap-2.5 rounded-lg border border-border bg-muted/35 px-3 py-2.5 text-left transition-colors hover:border-border-hover hover:bg-muted/70';

  return (
    <div className={`grid grid-cols-1 min-[380px]:grid-cols-3 gap-2 ${className}`.trim()}>
      <a
        href="https://x.com/real_Aki"
        target="_blank"
        rel="noopener noreferrer"
        className={itemClass}
        aria-label="X @real_Aki"
      >
        <Twitter className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" strokeWidth={1.5} />
        <span className="min-w-0">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">X</span>
          <span className="block truncate text-xs text-foreground">@real_Aki</span>
        </span>
      </a>

      <button type="button" onClick={copyDiscordUsername} className={itemClass} aria-label="Discord @xaki67">
        <SiDiscord className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
        <span className="min-w-0">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Discord</span>
          <span className="block truncate text-xs text-foreground">@xaki67</span>
        </span>
      </button>

      {thirdMethod === 'email' ? (
        contactEmail ? (
          <a href={`mailto:${contactEmail}`} className={itemClass}>
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" strokeWidth={1.5} />
            <span className="min-w-0">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Email</span>
              <span className="block truncate text-xs text-foreground">{contactEmail}</span>
            </span>
          </a>
        ) : (
          <span className={`${itemClass} cursor-not-allowed opacity-50`} aria-label={t('emailUnavailable')}>
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <span className="min-w-0">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Email</span>
              <span className="block truncate text-xs text-foreground">{t('emailUnavailable')}</span>
            </span>
          </span>
        )
      ) : (
        <button type="button" onClick={scrollToContactForm} className={itemClass}>
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" strokeWidth={1.5} />
          <span className="min-w-0">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{t('formLabel')}</span>
            <span className="block truncate text-xs text-foreground">{t('formContact')}</span>
          </span>
        </button>
      )}
    </div>
  );
}
