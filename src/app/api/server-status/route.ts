import { NextResponse } from 'next/server';
import { getServerStatusSnapshot } from '@/lib/server/serverStatus';

export async function GET() {
  try {
    return NextResponse.json(await getServerStatusSnapshot(), {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
