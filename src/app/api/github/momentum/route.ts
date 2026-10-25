import { NextResponse } from 'next/server';
import { getGithubMomentum } from '@/lib/server/github/momentum';
import { cacheWithTtl } from '@/lib/server/ttlCache';

const REVALIDATE_SECONDS = 900;

const getCachedMomentum = cacheWithTtl(getGithubMomentum, {
  ttlMs: REVALIDATE_SECONDS * 1000,
  failureTtlMs: 60_000,
  isFailure: (result) => !result.ok,
});

export async function GET() {
  const startedAt = Date.now();
  const result = await getCachedMomentum();
  const headers = {
    'Server-Timing': `github-momentum;dur=${Date.now() - startedAt}`,
    'Cache-Control': result.ok
      ? `public, max-age=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS}`
      : 'no-store',
  };

  return NextResponse.json(result.data, {
    status: result.ok ? 200 : 502,
    headers,
  });
}
