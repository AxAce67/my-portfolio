import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getTailscaleDeviceStatus } from './_lib/tailscaleStatus';

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
