import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { account } from '@/lib/appwrite/client';

type LoginFormProps = {
  onSuccess: () => void;
};

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations('Login');
  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await account.createEmailPasswordSession({ email, password });
      onSuccess();
    } catch {
      setError(t('errorInvalid'));
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-md mx-auto px-6 lg:px-8 py-24">
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>

        <div aria-live="polite" className="min-h-5">
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="login-email" className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
              {t('email')}
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
              {t('password')}
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? '…' : t('submit')}
          </button>
        </form>
      </div>
      <TransitionLink href={`/${locale}`} className="mt-4 inline-block text-xs font-mono text-muted-foreground hover:text-foreground" direction="backward">
        {t('backToSite')}
      </TransitionLink>
    </section>
  );
}
