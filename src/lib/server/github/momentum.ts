// Shared server-side implementation for the Next.js GitHub momentum route.

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const GITHUB_REST_ENDPOINT = 'https://api.github.com';
const REPOSITORY_PAGE_SIZE = 50;
const BRANCH_PAGE_SIZE = 50;
const COMMIT_PAGE_SIZE = 100;
const MAX_REPOSITORIES = 200;
const MAX_BRANCHES_PER_REPOSITORY = 200;
const MAX_COMMITS_PER_BRANCH = 500;

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
  oid?: string;
  committedDate?: string;
  author?: { user?: { login?: string } | null } | null;
};

type PageInfo = {
  hasNextPage?: boolean;
  endCursor?: string | null;
};

type CommitHistoryConnection = {
  nodes?: RepoCommitHistoryNode[];
  pageInfo?: PageInfo;
};

type BranchNode = {
  name?: string;
  target?: {
    history?: CommitHistoryConnection;
  } | null;
};

type RepoNode = {
  nameWithOwner?: string;
  refs?: {
    nodes?: BranchNode[];
    pageInfo?: PageInfo;
  };
};

type RepositoriesQueryData = {
  viewer?: {
    login?: string;
    repositories?: { nodes?: RepoNode[]; pageInfo?: PageInfo };
  };
};

type BranchesQueryData = {
  repository?: { refs?: { nodes?: BranchNode[]; pageInfo?: PageInfo } | null } | null;
};

type CommitsQueryData = {
  repository?: {
    ref?: {
      target?: {
        history?: CommitHistoryConnection;
      } | null;
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

async function requestGithubGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'akiz-portfolio',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).filter(Boolean).join(', ') || 'GitHub GraphQL error');
  }

  if (!payload.data) {
    throw new Error('GitHub GraphQL response did not include data');
  }

  return payload.data;
}

function countCommit(
  commit: RepoCommitHistoryNode,
  viewerLogin: string,
  dayKeys: string[],
  dailyMap: Map<string, number>,
  countedCommitIds: Set<string>,
) {
  if (!commit.oid || !commit.committedDate || countedCommitIds.has(commit.oid)) return;
  countedCommitIds.add(commit.oid);
  if (commit.author?.user?.login && commit.author.user.login.toLowerCase() !== viewerLogin.toLowerCase()) return;
  const key = commit.committedDate.slice(0, 10);
  if (!dayKeys.includes(key)) return;
  dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
}

function splitNameWithOwner(nameWithOwner: string) {
  const [owner, ...nameParts] = nameWithOwner.split('/');
  const name = nameParts.join('/');
  if (!owner || !name) return null;
  return { owner, name };
}

// Walks the viewer's most-recently-pushed repos and reads commit history across
// recent branches, instead of using contributionsCollection. GitHub's
// contribution graph can hide private-repo details behind "restricted"
// contributions, while default-branch-only history misses active work branches.
async function fetchMomentumViaGraphql(username: string, token: string, dayKeys: string[]) {
  const since = `${dayKeys[0]}T00:00:00Z`;
  const until = `${dayKeys[dayKeys.length - 1]}T23:59:59Z`;
  const dailyMap = new Map<string, number>(dayKeys.map((day) => [day, 0]));
  const countedCommitIds = new Set<string>();

  const repositoriesQuery = `
    query RecentCommitRepos($since: GitTimestamp!, $until: GitTimestamp!, $reposAfter: String) {
      viewer {
        login
        repositories(first: ${REPOSITORY_PAGE_SIZE}, after: $reposAfter, orderBy: {field: PUSHED_AT, direction: DESC}, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
          nodes {
            nameWithOwner
            pushedAt
            refs(refPrefix: "refs/heads/", first: ${BRANCH_PAGE_SIZE}, orderBy: {field: TAG_COMMIT_DATE, direction: DESC}) {
              nodes {
                name
                target {
                  ... on Commit {
                    history(since: $since, until: $until, first: ${COMMIT_PAGE_SIZE}) {
                      nodes {
                        oid
                        committedDate
                        author { user { login } }
                      }
                      pageInfo {
                        hasNextPage
                        endCursor
                      }
                    }
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  const branchesQuery = `
    query RecentCommitBranches($owner: String!, $name: String!, $since: GitTimestamp!, $until: GitTimestamp!, $branchesAfter: String) {
      repository(owner: $owner, name: $name) {
        refs(refPrefix: "refs/heads/", first: ${BRANCH_PAGE_SIZE}, after: $branchesAfter, orderBy: {field: TAG_COMMIT_DATE, direction: DESC}) {
          nodes {
            name
            target {
              ... on Commit {
                history(since: $since, until: $until, first: ${COMMIT_PAGE_SIZE}) {
                  nodes {
                    oid
                    committedDate
                    author { user { login } }
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  const commitsQuery = `
    query RecentCommitHistory($owner: String!, $name: String!, $qualifiedName: String!, $since: GitTimestamp!, $until: GitTimestamp!, $commitsAfter: String) {
      repository(owner: $owner, name: $name) {
        ref(qualifiedName: $qualifiedName) {
          target {
            ... on Commit {
              history(since: $since, until: $until, first: ${COMMIT_PAGE_SIZE}, after: $commitsAfter) {
                nodes {
                  oid
                  committedDate
                  author { user { login } }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        }
      }
    }
  `;

  let viewerLogin = '';
  let reposAfter: string | null = null;
  let repositoriesVisited = 0;

  while (repositoriesVisited < MAX_REPOSITORIES) {
    const data: RepositoriesQueryData = await requestGithubGraphql<RepositoriesQueryData>(
      token,
      repositoriesQuery,
      { since, until, reposAfter },
    );

    const viewer = data.viewer;
    if (!viewer?.login) {
      throw new Error('GitHub viewer login was not returned');
    }

    if (!viewerLogin) {
      viewerLogin = viewer.login;
      if (username && viewerLogin.toLowerCase() !== username.toLowerCase()) {
        throw new Error('Configured GitHub username does not match token owner');
      }
    }

    for (const repository of viewer.repositories?.nodes ?? []) {
      if (repositoriesVisited >= MAX_REPOSITORIES || !repository.nameWithOwner) break;
      repositoriesVisited += 1;

      const parsedRepository = splitNameWithOwner(repository.nameWithOwner);
      if (!parsedRepository) continue;

      let branchesVisited = 0;
      let branchesAfter: string | null = null;
      let branches = repository.refs?.nodes ?? [];
      let branchesPageInfo = repository.refs?.pageInfo ?? null;

      do {
        if (branchesAfter) {
          const branchData: BranchesQueryData = await requestGithubGraphql<BranchesQueryData>(
            token,
            branchesQuery,
            { ...parsedRepository, since, until, branchesAfter },
          );

          branches = branchData.repository?.refs?.nodes ?? [];
          branchesPageInfo = branchData.repository?.refs?.pageInfo ?? null;
        }

        for (const branch of branches) {
          if (branchesVisited >= MAX_BRANCHES_PER_REPOSITORY || !branch.name) break;
          branchesVisited += 1;

          const commits = branch.target?.history?.nodes ?? [];
          for (const commit of commits) {
            countCommit(commit, viewerLogin, dayKeys, dailyMap, countedCommitIds);
          }

          let commitsPageInfo = branch.target?.history?.pageInfo ?? null;
          let commitsAfter = commitsPageInfo?.endCursor ?? null;
          let commitsVisited = commits.length;

          while (commitsPageInfo?.hasNextPage && commitsAfter && commitsVisited < MAX_COMMITS_PER_BRANCH) {
            const commitData: CommitsQueryData = await requestGithubGraphql<CommitsQueryData>(token, commitsQuery, {
              ...parsedRepository,
              qualifiedName: `refs/heads/${branch.name}`,
              since,
              until,
              commitsAfter,
            });

            const history = commitData.repository?.ref?.target?.history;
            const nextCommits = history?.nodes ?? [];
            for (const commit of nextCommits) {
              countCommit(commit, viewerLogin, dayKeys, dailyMap, countedCommitIds);
            }

            commitsVisited += nextCommits.length;
            commitsPageInfo = history?.pageInfo ?? null;
            commitsAfter = commitsPageInfo?.endCursor ?? null;
          }
        }

        branchesAfter = branchesPageInfo?.endCursor ?? null;
      } while (branchesPageInfo?.hasNextPage && branchesAfter && branchesVisited < MAX_BRANCHES_PER_REPOSITORY);
    }

    const repositoriesPageInfo: PageInfo | undefined = data.viewer?.repositories?.pageInfo;
    reposAfter = repositoriesPageInfo?.endCursor ?? null;
    if (!repositoriesPageInfo?.hasNextPage || !reposAfter) break;
  }

  return toMomentumResponse(viewerLogin, 'graphql', dayKeys, dailyMap);
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
