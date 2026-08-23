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

type BeszelAuthResponse = {
  token?: string;
};

type BeszelSystem = {
  id: string;
  name: string;
  info?: {
    t?: number;
    cpu?: number;
    mp?: number;
    dp?: number;
  };
};

type BeszelStatsRecord = {
  system: string;
  stats?: {
    cpu?: number;
    m?: number;
    mu?: number;
    mp?: number;
    s?: number;
    d?: number;
    du?: number;
    dp?: number;
  };
};

export type ServerMetrics = {
  id: string;
  name: string;
  cpuPercent: number | null;
  cpuThreads: number | null;
  memoryUsedGb: number | null;
  memoryTotalGb: number | null;
  memoryPercent: number | null;
  diskUsedGb: number | null;
  diskTotalGb: number | null;
  diskPercent: number | null;
};

export type ServerStatusSnapshot = {
  devices: ServerStatusDevice[];
  metrics: ServerMetrics[];
};

const ONLINE_WINDOW_MS = 3 * 60 * 1000; // Tailscale clients check in roughly every 1-2 min

function maskTailnetIpv4(addresses?: string[]): string | null {
  const ipv4 = addresses?.find((address) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(address));
  if (!ipv4) return null;

  const [first, second] = ipv4.split('.');
  return `${first}.${second}.xx.xx`;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export async function getTailscaleDeviceStatus(): Promise<{ devices: ServerStatusDevice[] } | { error: string }> {
  const apiKey = process.env.TAILSCALE_API_KEY;
  const tailnet = process.env.TAILSCALE_TAILNET || '-';

  if (!apiKey) {
    return { error: 'TAILSCALE_API_KEY is not configured' };
  }

  const response = await fetch(`https://api.tailscale.com/api/v2/tailnet/${encodeURIComponent(tailnet)}/devices`, {
    cache: 'no-store',
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

export async function getBeszelServerMetrics(): Promise<{ metrics: ServerMetrics[] } | { error: string }> {
  const baseUrl = process.env.BESZEL_URL?.replace(/\/+$/, '');
  const email = process.env.BESZEL_EMAIL;
  const password = process.env.BESZEL_PASSWORD;

  if (!baseUrl || !email || !password) {
    return { metrics: [] };
  }

  const authResponse = await fetch(`${baseUrl}/api/collections/users/auth-with-password`, {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  });

  if (!authResponse.ok) {
    return { error: `Beszel auth responded with ${authResponse.status}` };
  }

  const auth = (await authResponse.json()) as BeszelAuthResponse;
  if (!auth.token) {
    return { error: 'Beszel auth did not return a token' };
  }

  const [systemsResponse, statsResponse] = await Promise.all([
    fetch(`${baseUrl}/api/collections/systems/records?perPage=100`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${auth.token}` },
    }),
    fetch(`${baseUrl}/api/collections/system_stats/records?perPage=200&sort=-created&filter=type%3D%221m%22`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${auth.token}` },
    }),
  ]);

  if (!systemsResponse.ok) {
    return { error: `Beszel systems responded with ${systemsResponse.status}` };
  }

  const systemsData = (await systemsResponse.json()) as { items?: BeszelSystem[] };
  const statsData = statsResponse.ok
    ? ((await statsResponse.json()) as { items?: BeszelStatsRecord[] })
    : { items: [] };

  const latestStats = new Map<string, BeszelStatsRecord['stats']>();
  for (const record of statsData.items ?? []) {
    if (!latestStats.has(record.system)) {
      latestStats.set(record.system, record.stats);
    }
  }

  const metrics: ServerMetrics[] = (systemsData.items ?? []).map((system) => {
    const stats = latestStats.get(system.id);

    return {
      id: system.id,
      name: system.name,
      cpuPercent: asNumber(stats?.cpu ?? system.info?.cpu),
      cpuThreads: asNumber(stats?.s ?? system.info?.t),
      memoryUsedGb: asNumber(stats?.mu),
      memoryTotalGb: asNumber(stats?.m),
      memoryPercent: asNumber(stats?.mp ?? system.info?.mp),
      diskUsedGb: asNumber(stats?.du),
      diskTotalGb: asNumber(stats?.d),
      diskPercent: asNumber(stats?.dp ?? system.info?.dp),
    };
  });

  return { metrics };
}

export async function getServerStatusSnapshot(): Promise<ServerStatusSnapshot> {
  const [tailscaleResult, beszelResult] = await Promise.allSettled([
    getTailscaleDeviceStatus(),
    getBeszelServerMetrics(),
  ]);

  const tailscaleValue = tailscaleResult.status === 'fulfilled' ? tailscaleResult.value : { devices: [] };
  const beszelValue = beszelResult.status === 'fulfilled' ? beszelResult.value : { metrics: [] };

  return {
    devices: 'devices' in tailscaleValue ? tailscaleValue.devices : [],
    metrics: 'metrics' in beszelValue ? beszelValue.metrics : [],
  };
}
