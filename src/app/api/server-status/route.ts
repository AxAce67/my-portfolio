import { NextResponse } from 'next/server';
import { getServerStatusSnapshot } from '@/lib/server/serverStatus';
import { cacheWithTtl } from '@/lib/server/ttlCache';

// Each uncached call logs in to Beszel and hits the Tailscale API.
const getCachedSnapshot = cacheWithTtl(getServerStatusSnapshot, { ttlMs: 30_000, failureTtlMs: 30_000 });

export async function GET() {
  try {
    return NextResponse.json(await getCachedSnapshot(), {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
