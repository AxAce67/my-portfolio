import type { VercelRequest, VercelResponse } from '@vercel/node';

// Inlined (was api/_lib/githubMomentum.ts) — Vercel's Node builder wasn't
// reliably bundling that separate file, causing ERR_MODULE_NOT_FOUND at
// runtime in production. Kept self-contained here instead; vite.config.ts's
// dev middleware imports this same file for local parity.

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const GITHUB_REST_ENDPOINT = 'https://api.github.com';
const REVALIDATE_SECONDS = 900;

export type MomentumResponse = {
  ok: boolean;
  username: string;
  weeklyCommits: number;
  streakDays: number;
  daily: Array<{ date: string; commits: number }>;
  updatedAt: string;
  source: 'graphql' | 'events';
};

type RepoCommitHistoryNode = {
  committedDate?: string;
  author?: { user?: { login?: string } | null } | null;
};

type RepoNode = {
  nameWithOwner?: string;
  defaultBranchRef?: {
    target?: {
      history?: { nodes?: RepoCommitHistoryNode[] };
    } | null;
  } | null;
};

function buildRecentDayKeys(now = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (6 - index)));
    return date.toISOString().slice(0, 10);
  });
}

function computeStreak(commitsPerDay: number[]) {
  let streak = 0;
  for (let index = commitsPerDay.length - 1; index >= 0; index -= 1) {
    if (commitsPerDay[index] > 0) streak += 1;
    else break;
  }
  return streak;
}

function toMomentumResponse(
  username: string,
  source: 'graphql' | 'events',
  dayKeys: string[],
  dailyMap: Map<string, number>,
): MomentumResponse {
  const commitsPerDay = dayKeys.map((day) => dailyMap.get(day) ?? 0);
  return {
    ok: true,
    username,
    weeklyCommits: commitsPerDay.reduce((sum, count) => sum + count, 0),
    streakDays: computeStreak(commitsPerDay),
    daily: dayKeys.map((day, index) => ({ date: day, commits: commitsPerDay[index] })),
    updatedAt: new Date().toISOString(),
    source,
  };
}

// Walks the viewer's most-recently-pushed repos and reads commit history
// directly, instead of using contributionsCollection. GitHub's contribution
// graph marks private-repo commits as "restricted" (count visible, repo
// breakdown hidden) based on a profile display setting that doesn't seem
// to apply retroactively even once enabled — querying commit history per
// repo sidesteps that privacy-display quirk entirely (the same `repo`
// scope already grants direct read access to these repos).
async function fetchMomentumViaGraphql(username: string, token: string, dayKeys: string[]) {
  const since = `${dayKeys[0]}T00:00:00Z`;
  const until = `${dayKeys[dayKeys.length - 1]}T23:59:59Z`;
  const dailyMap = new Map<string, number>(dayKeys.map((day) => [day, 0]));

  const query = `
    query RecentCommits($since: GitTimestamp!, $until: GitTimestamp!) {
      viewer {
        login
        repositories(first: 30, orderBy: {field: PUSHED_AT, direction: DESC}, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
          nodes {
            nameWithOwner
            pushedAt
            defaultBranchRef {
              target {
                ... on Commit {
                  history(since: $since, until: $until, first: 100) {
                    nodes {
                      committedDate
                      author { user { login } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'akiz-portfolio',
    },
    body: JSON.stringify({ query, variables: { since, until } }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: {
      viewer?: {
        login?: string;
        repositories?: { nodes?: RepoNode[] };
      };
    };
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).filter(Boolean).join(', ') || 'GitHub GraphQL error');
  }

  const viewer = payload.data?.viewer;
  if (!viewer?.login) {
    throw new Error('GitHub viewer login was not returned');
  }

  if (username && viewer.login.toLowerCase() !== username.toLowerCase()) {
    throw new Error('Configured GitHub username does not match token owner');
  }

  const repositories = viewer.repositories?.nodes ?? [];
  for (const repository of repositories) {
    const commits = repository.defaultBranchRef?.target?.history?.nodes ?? [];
    for (const commit of commits) {
      if (!commit.committedDate) continue;
      if (commit.author?.user?.login && commit.author.user.login.toLowerCase() !== viewer.login.toLowerCase()) continue;
      const key = commit.committedDate.slice(0, 10);
      if (!dailyMap.has(key)) continue;
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }
  }

  return toMomentumResponse(viewer.login, 'graphql', dayKeys, dailyMap);
}

async function fetchMomentumViaPublicEvents(username: string, dayKeys: string[]) {
  const dailyMap = new Map<string, number>(dayKeys.map((day) => [day, 0]));
  const weekStartIso = `${dayKeys[0]}T00:00:00Z`;

  const responses = await Promise.all([
    fetch(`${GITHUB_REST_ENDPOINT}/users/${username}/events/public?per_page=100&page=1`),
    fetch(`${GITHUB_REST_ENDPOINT}/users/${username}/events/public?per_page=100&page=2`),
    fetch(`${GITHUB_REST_ENDPOINT}/users/${username}/events/public?per_page=100&page=3`),
  ]);

  if (responses.some((response) => !response.ok)) {
    throw new Error('GitHub public events request failed');
  }

  const payloads = await Promise.all(responses.map((response) => response.json()));
  const events = payloads.flat() as Array<{
    type?: string;
    created_at?: string;
    payload?: { commits?: unknown[] };
  }>;

  for (const event of events) {
    if (event.type !== 'PushEvent' || !event.created_at || event.created_at < weekStartIso) continue;
    const dayKey = event.created_at.slice(0, 10);
    if (!dailyMap.has(dayKey)) continue;
    const commitCount = Array.isArray(event.payload?.commits) ? event.payload.commits.length : 0;
    dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + commitCount);
  }

  return toMomentumResponse(username, 'events', dayKeys, dailyMap);
}

export async function getGithubMomentum(): Promise<{ data: MomentumResponse; ok: true } | { data: MomentumResponse; ok: false }> {
  const username = process.env.GITHUB_USERNAME?.trim() || 'AxAce67';
  const token = process.env.GITHUB_TOKEN?.trim();
  const dayKeys = buildRecentDayKeys();

  try {
    const data = token
      ? await fetchMomentumViaGraphql(username, token, dayKeys)
      : await fetchMomentumViaPublicEvents(username, dayKeys);
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      data: {
        ok: false,
        username,
        weeklyCommits: 0,
        streakDays: 0,
        daily: dayKeys.map((date) => ({ date, commits: 0 })),
        updatedAt: new Date().toISOString(),
        source: token ? 'graphql' : 'events',
      },
    };
  }
}

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
