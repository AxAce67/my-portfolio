import { NextResponse } from 'next/server';
import { getTailscaleDeviceStatus } from '@/lib/server/serverStatus';

export async function GET() {
  try {
    const result = await getTailscaleDeviceStatus();
    if ('error' in result) {
      return NextResponse.json(result, { status: 502 });
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
