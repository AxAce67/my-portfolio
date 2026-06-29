import { NextResponse } from 'next/server';
import { getGithubMomentum } from '@/lib/server/github/momentum';

const REVALIDATE_SECONDS = 900;

export async function GET() {
  const startedAt = Date.now();
  const result = await getGithubMomentum();
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
