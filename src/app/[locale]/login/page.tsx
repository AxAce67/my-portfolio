import Link from 'next/link';
import { loginAction } from './actions';
import { sanitizeInternalPath } from '@/lib/security';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = await searchParams;
  const nextPath = sanitizeInternalPath(query.next, `/${locale}/dashboard`);
  const hasError = query.error === 'invalid_credentials';
  const isRateLimited = query.error === 'rate_limited';

  return (
    <section className="max-w-md mx-auto px-6 lg:px-8 py-24">
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Login</h1>

        {hasError && (
          <p className="text-sm text-red-500">メールアドレスまたはパスワードが違います。</p>
        )}
        {isRateLimited && (
          <p className="text-sm text-red-500">
            試行回数が多すぎます。10分ほど待ってから再試行してください。
          </p>
        )}

        <form action={loginAction.bind(null, locale)} className="space-y-3">
          <input type="hidden" name="next" value={nextPath} />
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Email</label>
            <input name="email" type="email" required className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Password</label>
            <input name="password" type="password" required className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
          </div>

          <button type="submit" className="btn-primary w-full">Sign In</button>
        </form>

      </div>
      <Link href={`/${locale}`} className="mt-4 inline-block text-xs font-mono text-muted-foreground hover:text-foreground">
        ← Back to Site
      </Link>
    </section>
  );
}
