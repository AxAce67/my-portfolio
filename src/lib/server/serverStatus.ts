// Shared server-side implementation for the Next.js server status route.

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
