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
};

// `status` below is the fallback shown if /api/server-status is
// unavailable (no TAILSCALE_API_KEY configured, or no match found for
// `tailscaleHostname`). Edit this list to match your real machine(s).
export const selfHostedServers: SelfHostedServer[] = [
  {
    id: 'jp-server',
    name: 'JP Server',
    description: '日本リージョンで運用しているサーバー。',
    category: 'infra',
    status: 'online',
    tailscaleHostname: 'jp-server',
  },
  {
    id: 'us-server',
    name: 'US Server',
    description: '米国リージョンで運用しているサーバー。',
    category: 'infra',
    status: 'online',
    tailscaleHostname: 'us-server',
  },
  {
    id: 'aki-hp-envy-laptop',
    name: 'HP ENVY Laptop',
    description: 'ノートPCを転用したサーバー。',
    category: 'infra',
    status: 'online',
    tailscaleHostname: 'aki-hp-envy-laptop-13-ba1xxx',
  },
  {
    id: 'sg-server',
    name: 'SG Server',
    description: 'シンガポールリージョンで運用しているサーバー。',
    category: 'infra',
    status: 'online',
    tailscaleHostname: 'sg-server',
  },
];
