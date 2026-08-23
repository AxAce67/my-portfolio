import { NextResponse } from 'next/server';
import { getBeszelServerMetrics, getTailscaleDeviceStatus } from '@/lib/server/serverStatus';

export async function GET() {
  try {
    const [tailscaleResult, beszelResult] = await Promise.all([
      getTailscaleDeviceStatus(),
      getBeszelServerMetrics(),
    ]);

    const devices = 'devices' in tailscaleResult ? tailscaleResult.devices : [];
    const metrics = 'metrics' in beszelResult ? beszelResult.metrics : [];

    if ('error' in tailscaleResult && 'error' in beszelResult) {
      return NextResponse.json({ error: 'Status providers unavailable' }, { status: 502 });
    }

    return NextResponse.json({
      devices,
      metrics,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
