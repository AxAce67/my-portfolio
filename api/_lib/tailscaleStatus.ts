// Shared by both the Vercel serverless function (api/server-status.ts, used
// in production) and the Vite dev-server middleware (vite.config.ts, used
// for local `npm run dev`) so the same logic runs in both places.

type TailscaleDevice = {
  id: string;
  name: string;
  hostname: string;
  lastSeen?: string;
  os?: string;
  addresses?: string[];
  clientVersion?: string;
};

export type ServerStatusDevice = {
  id: string;
  name: string;
  hostname: string;
  online: boolean;
  lastSeen: string | null;
  os: string | null;
  ip: string | null;
};

const ONLINE_WINDOW_MS = 3 * 60 * 1000; // Tailscale clients check in roughly every 1-2 min

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
    // addresses[0] is the IPv4 100.x.x.x tailnet address; addresses[1] (if
    // present) is the IPv6 one — only the IPv4 is worth showing on the card.
    const ipv4 = device.addresses?.find((addr) => !addr.includes(':')) ?? null;
    return {
      id: device.id,
      name: device.name,
      hostname: device.hostname,
      online: now - lastSeenMs < ONLINE_WINDOW_MS,
      lastSeen: device.lastSeen ?? null,
      os: device.os ?? null,
      ip: ipv4,
    };
  });

  return { devices };
}
