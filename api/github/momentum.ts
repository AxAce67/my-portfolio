import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGithubMomentum } from '../_lib/githubMomentum';

const REVALIDATE_SECONDS = 900;

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const result = await getGithubMomentum();

  if (!result.ok) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json(result.data);
    return;
  }

  res.setHeader('Cache-Control', `public, max-age=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS}`);
  res.status(200).json(result.data);
}
