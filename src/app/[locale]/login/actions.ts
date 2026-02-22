'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { sanitizeInternalPath } from '@/lib/security';
import { clearFailures, getFailureCount, recordFailure } from '@/lib/security/rateLimit';
import { recordLoginAudit } from '@/lib/security/authAudit';

const LOGIN_WINDOW_SECONDS = 10 * 60;
const LOGIN_MAX_ATTEMPTS = 7;

function getRateLimitBucketKey(email: string, ipAddress: string) {
  return `auth:login:${email.toLowerCase()}::${ipAddress}`;
}

export async function loginAction(locale: string, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const fallbackPath = `/${locale}/dashboard`;
  const nextPath = sanitizeInternalPath(String(formData.get('next') ?? ''), fallbackPath);
  const headerStore = await headers();
  const ipAddress = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const userAgent = headerStore.get('user-agent') ?? 'unknown';
  const bucketKey = getRateLimitBucketKey(email, ipAddress);
  const currentFailures = await getFailureCount(bucketKey, LOGIN_WINDOW_SECONDS);
  if (currentFailures >= LOGIN_MAX_ATTEMPTS) {
    await recordLoginAudit({
      email,
      ipAddress,
      userAgent,
      locale,
      outcome: 'rate_limited',
      userId: null,
    });
    redirect(`/${locale}/login?error=rate_limited&next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const failures = await recordFailure(bucketKey, LOGIN_WINDOW_SECONDS);
    await recordLoginAudit({
      email,
      ipAddress,
      userAgent,
      locale,
      outcome: failures >= LOGIN_MAX_ATTEMPTS ? 'rate_limited' : 'invalid_credentials',
      userId: null,
    });
    if (failures >= LOGIN_MAX_ATTEMPTS) {
      redirect(`/${locale}/login?error=rate_limited&next=${encodeURIComponent(nextPath)}`);
    }
    redirect(`/${locale}/login?error=invalid_credentials&next=${encodeURIComponent(nextPath)}`);
  }

  await clearFailures(bucketKey);
  await recordLoginAudit({
    email,
    ipAddress,
    userAgent,
    locale,
    outcome: 'success',
    userId: data.user?.id ?? null,
  });
  redirect(nextPath);
}

export async function logoutAction(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}
