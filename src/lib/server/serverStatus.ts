// Shared server-side implementation for the Next.js server status route.

type TailscaleDevice = {
  id: string;
  name: string;
  hostname: string;
  lastSeen?: string;
  os?: string;
  addresses?: string[];
};

type ServerStatusDevice = {
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
    cpus?: number[];
    m?: number;
    mu?: number;
    mp?: number;
    d?: number;
    du?: number;
    dp?: number;
  };
};

type ServerMetrics = {
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

// Tailscale API keys expire after at most 90 days. An OAuth client does not
// expire; it trades its ID and secret for an access token that lasts one
// hour, which is cached here and renewed a few minutes before it runs out.
let oauthToken: { value: string; expiresAt: number } | null = null;

async function getTailscaleAuthHeader(): Promise<string | null> {
  const clientId = process.env.TAILSCALE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.TAILSCALE_OAUTH_CLIENT_SECRET?.trim();

  if (clientId && clientSecret) {
    if (!oauthToken || oauthToken.expiresAt - Date.now() < 5 * 60 * 1000) {
      const response = await fetch('https://api.tailscale.com/api/v2/oauth/token', {
        method: 'POST',
        cache: 'no-store',
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      if (!response.ok) {
        oauthToken = null;
        return null;
      }
      const token = (await response.json()) as { access_token?: string; expires_in?: number };
      if (!token.access_token) return null;
      oauthToken = { value: token.access_token, expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000 };
    }
    return `Bearer ${oauthToken.value}`;
  }

  const apiKey = process.env.TAILSCALE_API_KEY;
  return apiKey ? `Basic ${btoa(`${apiKey}:`)}` : null;
}

async function getTailscaleDeviceStatus(): Promise<{ devices: ServerStatusDevice[] } | { error: string }> {
  const tailnet = process.env.TAILSCALE_TAILNET || '-';
  const authorization = await getTailscaleAuthHeader();

  if (!authorization) {
    return { error: 'Tailscale credentials are not configured or were rejected' };
  }

  const response = await fetch(`https://api.tailscale.com/api/v2/tailnet/${encodeURIComponent(tailnet)}/devices`, {
    cache: 'no-store',
    headers: {
      Authorization: authorization,
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

async function getBeszelServerMetrics(): Promise<{ metrics: ServerMetrics[] } | { error: string }> {
  const baseUrl = process.env.BESZEL_URL?.trim().replace(/\/+$/, '');
  const email = process.env.BESZEL_EMAIL?.trim();
  const password = process.env.BESZEL_PASSWORD?.trim();

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
      // Beszel's stats.s is total swap space in GB, not a CPU count.
      // Thread count lives in the system snapshot (info.t); the
      // per-thread CPU series is a reliable fallback for older records.
      cpuThreads: asNumber(system.info?.t ?? stats?.cpus?.length),
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
  const tailscaleDevices = 'devices' in tailscaleValue ? tailscaleValue.devices : [];
  const beszelMetrics = 'metrics' in beszelValue ? beszelValue.metrics : [];
  // Surface why a source returned nothing (e.g. an expired API key) in the
  // server log instead of failing silently.
  if ('error' in tailscaleValue) console.error('[serverStatus] Tailscale:', tailscaleValue.error);
  if (tailscaleResult.status === 'rejected') console.error('[serverStatus] Tailscale request failed:', tailscaleResult.reason);
  if ('error' in beszelValue) console.error('[serverStatus] Beszel:', beszelValue.error);

  return {
    devices: tailscaleDevices,
    metrics: beszelMetrics,
  };
}
