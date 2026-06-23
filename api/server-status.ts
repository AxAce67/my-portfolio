import type { VercelRequest, VercelResponse } from '@vercel/node';

// Inlined (was api/_lib/tailscaleStatus.ts) — Vercel's Node builder wasn't
// reliably bundling that separate file, causing ERR_MODULE_NOT_FOUND at
// runtime in production. Kept self-contained here instead; vite.config.ts's
// dev middleware imports this same file for local parity.

type TailscaleDevice = {
  id: string;
  name: string;
  hostname: string;
  lastSeen?: string;
  os?: string;
  addresses?: string[];
};

export type ServerStatusDevice = {
  id: string;
  name: string;
  online: boolean;
  lastSeen: string | null;
  os: string | null;
  maskedIp: string | null;
};

const ONLINE_WINDOW_MS = 3 * 60 * 1000; // Tailscale clients check in roughly every 1-2 min

function maskTailnetIpv4(addresses?: string[]): string | null {
  const ipv4 = addresses?.find((address) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(address));
  if (!ipv4) return null;

  const [first, second] = ipv4.split('.');
  return `${first}.${second}.xx.xx`;
}

export async function getTailscaleDeviceStatus(): Promise<{ devices: ServerStatusDevice[] } | { error: string }> {
  const apiKey = process.env.TAILSCALE_API_KEY;
  const tailnet = process.env.TAILSCALE_TAILNET || '-';

  if (!apiKey) {
    return { error: 'TAILSCALE_API_KEY is not configured' };
  }

  const response = await fetch(`https://api.tailscale.com/api/v2/tailnet/${encodeURIComponent(tailnet)}/devices`, {
    headers: {
      Authorization: `Basic ${btoa(`${apiKey}:`)}`,
    },
  });

  if (!response.ok) {
    return { error: `Tailscale API responded with ${response.status}` };
  }

  const data = (await response.json()) as { devices?: TailscaleDevice[] };
  const now = Date.now();

  const devices: ServerStatusDevice[] = (data.devices ?? []).map((device) => {
    const lastSeenMs = device.lastSeen ? new Date(device.lastSeen).getTime() : 0;
    return {
      id: device.id,
      // Only expose the short identifier needed by the public status page.
      // Tailnet FQDNs and private 100.x addresses are intentionally omitted.
      name: device.name.split('.')[0] || device.hostname,
      online: now - lastSeenMs < ONLINE_WINDOW_MS,
      lastSeen: device.lastSeen ?? null,
      os: device.os ?? null,
      maskedIp: maskTailnetIpv4(device.addresses),
    };
  });

  return { devices };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const result = await getTailscaleDeviceStatus();
    if ('error' in result) {
      res.status(502).json(result);
      return;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(result);
  } catch {
    res.status(500).json({ error: 'Internal error' });
  }
}
