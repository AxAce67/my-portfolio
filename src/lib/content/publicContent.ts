import { Query, type Models } from 'appwrite';
import { tablesDB, DATABASE_ID, PROJECTS_TABLE_ID, ACTIVE_PROJECTS_TABLE_ID, SITE_SETTINGS_TABLE_ID } from '@/lib/appwrite/client';

type ProjectRow = Models.Row & {
  title: string | null;
  description: string | null;
  content_md: string | null;
  content_json: string | null;
  thumbnail_url: string | null;
  is_published: boolean | null;
  status: string | null;
  tags: string[] | null;
};

type ActiveProjectRow = Models.Row & {
  name: string | null;
  stage: number | null;
};

type ProjectDetailRecord = {
  id: string;
  title: string | null;
  description: string | null;
  content_md: string | null;
  content_json: unknown;
  created_at: string | null;
  updated_at: string | null;
  is_published: boolean | null;
  thumbnail_url: string | null;
};

export type ProjectDetailResult =
  | { status: 'ok'; project: ProjectDetailRecord }
  | { status: 'not_found'; project: null }
  | { status: 'unavailable'; project: null };

export type HomeProject = {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  tags: string[];
};

export type HomeActiveProject = {
  id: string;
  name: string;
  stage: number;
};

export function parseContentJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fetchPublishedProjectsWithTags(limit?: number): Promise<HomeProject[]> {
  const rows = await tablesDB.listRows<ProjectRow>({
    databaseId: DATABASE_ID,
    tableId: PROJECTS_TABLE_ID,
    queries: [
      Query.equal('status', 'completed'),
      Query.equal('is_published', true),
      Query.orderDesc('$updatedAt'),
      Query.limit(limit ?? 100),
    ],
  });

  return rows.rows.map((row) => ({
    id: row.$id,
    title: row.title ?? 'Untitled',
    description: row.description ?? '',
    thumbnail_url: row.thumbnail_url ?? null,
    created_at: row.$createdAt ?? null,
    updated_at: row.$updatedAt ?? null,
    tags: row.tags ?? [],
  }));
}

async function fetchPublishedActiveProjects(): Promise<HomeActiveProject[]> {
  const rows = await tablesDB.listRows<ActiveProjectRow>({
    databaseId: DATABASE_ID,
    tableId: ACTIVE_PROJECTS_TABLE_ID,
    queries: [
      Query.equal('is_published', true),
      Query.orderAsc('display_order'),
      Query.orderAsc('$createdAt'),
      Query.limit(100),
    ],
  });

  return rows.rows.map((row) => ({
    id: row.$id,
    name: row.name ?? '',
    stage: row.stage ?? 0,
  }));
}

export async function getHomePageData() {
  const [projects, activeProjects] = await Promise.allSettled([
    fetchPublishedProjectsWithTags(8),
    fetchPublishedActiveProjects(),
  ]);

  if (projects.status === 'rejected') {
    console.error('[publicContent] Failed to load home projects', projects.reason);
  }

  if (activeProjects.status === 'rejected') {
    console.error('[publicContent] Failed to load active projects', activeProjects.reason);
  }

  return {
    projects: projects.status === 'fulfilled' ? projects.value : [],
    activeProjects: activeProjects.status === 'fulfilled' ? activeProjects.value : [],
  };
}

export async function getProjectsListData() {
  try {
    return await fetchPublishedProjectsWithTags();
  } catch (error) {
    console.error('[publicContent] Failed to load projects list', error);
    return [];
  }
}

async function getCachedProjectDetail(id: string): Promise<ProjectRow | null> {
  try {
    const row = await tablesDB.getRow<ProjectRow>({
      databaseId: DATABASE_ID,
      tableId: PROJECTS_TABLE_ID,
      rowId: id,
    });
    return row.is_published ? row : null;
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code === 404 || code === 400) return null;
    throw error;
  }
}

export async function getProjectById(id: string): Promise<ProjectDetailResult> {
  try {
    const row = await getCachedProjectDetail(id);
    if (!row) {
      return { status: 'not_found', project: null };
    }

    const project: ProjectDetailRecord = {
      id: row.$id,
      title: row.title ?? null,
      description: row.description ?? null,
      content_md: row.content_md ?? null,
      content_json: parseContentJson(row.content_json),
      created_at: row.$createdAt ?? null,
      updated_at: row.$updatedAt ?? null,
      is_published: row.is_published ?? null,
      thumbnail_url: row.thumbnail_url ?? null,
    };

    return { status: 'ok', project };
  } catch (error) {
    console.error('[publicContent] Failed to load project detail', error);
    return { status: 'unavailable', project: null };
  }
}

export const DEFAULT_AVATAR_URL = '/images/profile/akiz-profile.jpg';

export async function getSiteSettings(): Promise<{ avatarUrl: string | null }> {
  try {
    const row = await tablesDB.getRow<Models.Row & { avatar_url: string | null }>({
      databaseId: DATABASE_ID,
      tableId: SITE_SETTINGS_TABLE_ID,
      rowId: 'main',
    });
    return { avatarUrl: row.avatar_url || null };
  } catch (error) {
    console.error('[publicContent] Failed to load site settings', error);
    return { avatarUrl: null };
  }
}
