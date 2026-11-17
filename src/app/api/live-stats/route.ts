import { NextResponse } from 'next/server';
import { getLiveStats } from '@/lib/server/liveStats';
import { cacheWithTtl } from '@/lib/server/ttlCache';

// One round of outside requests a minute at most, however many people visit.
const getCached = cacheWithTtl(getLiveStats, { ttlMs: 60_000, failureTtlMs: 30_000 });

export async function GET() {
  try {
    return NextResponse.json(await getCached(), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
