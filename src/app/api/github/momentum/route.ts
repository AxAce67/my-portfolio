import { NextResponse } from 'next/server';

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const GITHUB_REST_ENDPOINT = 'https://api.github.com';

type MomentumResponse = {
  ok: boolean;
  username: string;
  weeklyCommits: number;
  streakDays: number;
  daily: Array<{ date: string; commits: number }>;
  updatedAt: string;
  source: 'graphql' | 'events';
};

type GraphQlContributionNode = {
  occurredAt?: string;
  commitCount?: number;
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

async function fetchMomentumViaGraphql(username: string, token: string, dayKeys: string[]) {
  const from = `${dayKeys[0]}T00:00:00Z`;
  const to = `${dayKeys[dayKeys.length - 1]}T23:59:59Z`;
  const dailyMap = new Map<string, number>(dayKeys.map((day) => [day, 0]));

  const query = `
    query ContributionCommits($from: DateTime!, $to: DateTime!) {
      viewer {
        login
        contributionsCollection(from: $from, to: $to) {
          commitContributionsByRepository(maxRepositories: 100) {
            contributions(first: 100) {
              nodes {
                occurredAt
                commitCount
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
    body: JSON.stringify({
      query,
      variables: { from, to },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: {
      viewer?: {
        login?: string;
        contributionsCollection?: {
          commitContributionsByRepository?: Array<{
            contributions?: {
              nodes?: GraphQlContributionNode[];
            };
          }>;
        };
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

  const repositories = viewer.contributionsCollection?.commitContributionsByRepository ?? [];
  for (const repository of repositories) {
    const nodes = repository.contributions?.nodes ?? [];
    for (const node of nodes) {
      if (!node.occurredAt || typeof node.commitCount !== 'number') continue;
      const key = node.occurredAt.slice(0, 10);
      if (!dailyMap.has(key)) continue;
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + node.commitCount);
    }
  }

  return toMomentumResponse(viewer.login, 'graphql', dayKeys, dailyMap);
}

async function fetchMomentumViaPublicEvents(username: string, dayKeys: string[]) {
  const dailyMap = new Map<string, number>(dayKeys.map((day) => [day, 0]));
  const weekStartIso = `${dayKeys[0]}T00:00:00Z`;

  const responses = await Promise.all([
    fetch(`${GITHUB_REST_ENDPOINT}/users/${username}/events/public?per_page=100&page=1`, { cache: 'no-store' }),
    fetch(`${GITHUB_REST_ENDPOINT}/users/${username}/events/public?per_page=100&page=2`, { cache: 'no-store' }),
    fetch(`${GITHUB_REST_ENDPOINT}/users/${username}/events/public?per_page=100&page=3`, { cache: 'no-store' }),
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

export async function GET() {
  const username = process.env.GITHUB_USERNAME?.trim() || 'AxAce67';
  const token = process.env.GITHUB_TOKEN?.trim();
  const dayKeys = buildRecentDayKeys();

  try {
    if (token) {
      const data = await fetchMomentumViaGraphql(username, token, dayKeys);
      return NextResponse.json(data);
    }

    const data = await fetchMomentumViaPublicEvents(username, dayKeys);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        username,
        weeklyCommits: 0,
        streakDays: 0,
        daily: dayKeys.map((date) => ({ date, commits: 0 })),
        updatedAt: new Date().toISOString(),
        source: token ? 'graphql' : 'events',
      } satisfies MomentumResponse,
      { status: 502 },
    );
  }
}
