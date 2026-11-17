// Live numbers for the home page tiles, read server-side from my own services:
// the three NTP servers' status pages, Atlas's public stats and the ADS-B
// receiver's tar1090 feed. Each source may fail on its own; the rest still show.
const NTP_HOSTS = ['ntp-jp.aki.sh', 'ntp-sg.aki.sh', 'ntp-us.aki.sh'];
const TIMEOUT_MS = 5_000;
const HEADERS = { 'User-Agent': 'aki.sh live tiles (+https://aki.sh)' };

export type LiveStats = {
  ntp: { daily: number; servers: number } | null;
  atlas: { cameras: number; countries: number; onMap: number } | null;
  adsb: { aircraft: number } | null;
  updatedAt: string;
};

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: HEADERS, cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return (await response.json()) as T;
}

async function ntp(): Promise<LiveStats['ntp']> {
  const results = await Promise.allSettled(
    NTP_HOSTS.map((host) => getJson<{ usage?: { ntp_24h?: number } }>(`https://${host}/status.json`)),
  );
  const counts = results.flatMap((r) => (r.status === 'fulfilled' && typeof r.value.usage?.ntp_24h === 'number' ? [r.value.usage.ntp_24h] : []));
  return counts.length ? { daily: counts.reduce((a, b) => a + b, 0), servers: counts.length } : null;
}

async function atlas(): Promise<LiveStats['atlas']> {
  const d = await getJson<{ cameras: number; countries: number; onMap: number }>('https://atlas.aki.sh/api/stats');
  return typeof d.cameras === 'number' ? { cameras: d.cameras, countries: d.countries, onMap: d.onMap } : null;
}

async function adsb(): Promise<LiveStats['adsb']> {
  const d = await getJson<{ aircraft?: Array<{ lat?: number; seen_pos?: number }> }>('https://tar1090.aki.sh/tar1090/data/aircraft.json');
  // Aircraft with a position heard in the last minute, as the radar map shows them.
  const aircraft = (d.aircraft ?? []).filter((a) => typeof a.lat === 'number' && (a.seen_pos ?? 0) < 60).length;
  return { aircraft };
}

const settle = async <T>(p: Promise<T>): Promise<T | null> => {
  try {
    return await p;
  } catch {
    return null;
  }
};

export async function getLiveStats(): Promise<LiveStats> {
  const [n, a, b] = await Promise.all([settle(ntp()), settle(atlas()), settle(adsb())]);
  return { ntp: n, atlas: a, adsb: b, updatedAt: new Date().toISOString() };
}
