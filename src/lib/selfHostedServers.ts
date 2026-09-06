export type ServerStatus = 'online' | 'offline' | 'maintenance';

export type SelfHostedServer = {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'game' | 'bot' | 'infra';
  status: ServerStatus;
  specs?: string;
  url?: string;
  /**
   * Device `name` (or `hostname`) as it appears in the Tailscale admin
   * console / API response. When set, ServersPage overrides `status` above
   * with live online/offline info from /api/server-status — edit this to
   * match your actual tailnet device name.
   */
  tailscaleHostname?: string;
  /**
   * System name as it appears in Beszel. Defaults to `tailscaleHostname`/`id`
   * when omitted.
   */
  beszelName?: string;
};

// `status` below is the fallback shown if /api/server-status is
// unavailable (no TAILSCALE_API_KEY configured, or no match found for
// `tailscaleHostname`). Edit this list to match your real machine(s).
export const selfHostedServers: SelfHostedServer[] = [
  {
    id: 'home-server',
    name: 'Home Server',
    description: '自宅環境でアプリケーションを運用しているサーバー。',
    category: 'infra',
    status: 'online',
    tailscaleHostname: 'home-server',
    beszelName: 'home-server',
  },
  {
    id: 'home-nas',
    name: 'Home NAS',
    description: '自宅環境のストレージを担うNASサーバー。',
    category: 'infra',
    status: 'online',
    tailscaleHostname: 'home-nas',
    beszelName: 'home-nas',
  },
  {
    id: 'jp-server',
    name: 'JP Server',
    description: '日本リージョンで運用しているサーバー。',
    category: 'infra',
    status: 'online',
    tailscaleHostname: 'jp-server',
    beszelName: 'jp-server',
  },
  {
    id: 'jp-server-2',
    name: 'JP Server 2',
    description: '日本リージョンで運用している2台目のサーバー。',
    category: 'infra',
    status: 'online',
    tailscaleHostname: 'jp-server-2',
    beszelName: 'jp-server-2',
  },
  {
    id: 'us-server',
    name: 'US Server',
    description: '米国リージョンで運用しているサーバー。',
    category: 'infra',
    status: 'online',
    tailscaleHostname: 'us-server',
    beszelName: 'us-server',
  },
  {
    id: 'sg-server',
    name: 'SG Server',
    description: 'シンガポールリージョンで運用しているサーバー。',
    category: 'infra',
    status: 'online',
    tailscaleHostname: 'sg-server',
    beszelName: 'sg-server',
  },
];
