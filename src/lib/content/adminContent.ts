import { ID, Query, type Models } from 'appwrite';
import {
  tablesDB,
  storage,
  DATABASE_ID,
  PROJECTS_TABLE_ID,
  ACTIVE_PROJECTS_TABLE_ID,
  SITE_SETTINGS_TABLE_ID,
  MUTUAL_LINKS_TABLE_ID,
  ASSETS_BUCKET_ID,
} from '@/lib/appwrite/client';
import { parseContentJson } from '@/lib/content/publicContent';

export type ProjectStatus = 'idea' | 'design' | 'development' | 'completed' | 'on_hold';

type ProjectRow = Models.Row & {
  title: string | null;
  description: string | null;
  content_md: string | null;
  content_json: string | null;
  thumbnail_url: string | null;
  is_published: boolean | null;
  status: ProjectStatus | null;
  tags: string[] | null;
};

type ActiveProjectRow = Models.Row & {
  name: string | null;
  stage: number | null;
  display_order: number | null;
  is_published: boolean | null;
};

export type AdminProjectSummary = {
  id: string;
  title: string;
  status: ProjectStatus;
  is_published: boolean;
  thumbnail_url: string | null;
  updated_at: string;
};

export type AdminProjectDetail = {
  id: string;
  title: string;
  description: string;
  content_md: string;
  content_json: unknown;
  status: ProjectStatus;
  is_published: boolean;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = {
  title: string;
  description: string;
  content_md: string;
  content_json: unknown;
  status: ProjectStatus;
  is_published: boolean;
  thumbnail_url?: string | null;
};

export type AdminActiveProject = {
  id: string;
  name: string;
  stage: number;
  display_order: number;
  is_published: boolean;
  updated_at: string;
};

export type ActiveProjectInput = {
  name: string;
  stage: number;
  display_order: number;
  is_published: boolean;
};

function toProjectSummary(row: ProjectRow): AdminProjectSummary {
  return {
    id: row.$id,
    title: row.title ?? 'Untitled',
    status: row.status ?? 'idea',
    is_published: row.is_published ?? false,
    thumbnail_url: row.thumbnail_url ?? null,
    updated_at: row.$updatedAt,
  };
}

export async function listAdminProjects(): Promise<AdminProjectSummary[]> {
  const rows = await tablesDB.listRows<ProjectRow>({
    databaseId: DATABASE_ID,
    tableId: PROJECTS_TABLE_ID,
    queries: [Query.orderDesc('$updatedAt'), Query.limit(100)],
  });
  return rows.rows.map(toProjectSummary);
}

export async function getAdminProjectById(id: string): Promise<AdminProjectDetail | null> {
  try {
    const row = await tablesDB.getRow<ProjectRow>({ databaseId: DATABASE_ID, tableId: PROJECTS_TABLE_ID, rowId: id });
    return {
      id: row.$id,
      title: row.title ?? '',
      description: row.description ?? '',
      content_md: row.content_md ?? '',
      content_json: parseContentJson(row.content_json),
      status: row.status ?? 'idea',
      is_published: row.is_published ?? false,
      thumbnail_url: row.thumbnail_url ?? null,
      created_at: row.$createdAt,
      updated_at: row.$updatedAt,
    };
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code === 404 || code === 400) return null;
    throw error;
  }
}

function projectInputToData(input: ProjectInput) {
  return {
    title: input.title,
    description: input.description,
    content_md: input.content_md,
    content_json: JSON.stringify(input.content_json ?? []),
    status: input.status,
    is_published: input.is_published,
    ...(input.thumbnail_url !== undefined ? { thumbnail_url: input.thumbnail_url } : {}),
  };
}

export async function createProject(input: ProjectInput): Promise<string> {
  const row = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: PROJECTS_TABLE_ID,
    rowId: ID.unique(),
    data: projectInputToData(input),
  });
  return row.$id;
}

export async function updateProject(id: string, input: ProjectInput): Promise<void> {
  try {
    const existing = await tablesDB.getRow<ProjectRow>({ databaseId: DATABASE_ID, tableId: PROJECTS_TABLE_ID, rowId: id });

    const oldFileIds = new Set<string>();
    if (existing.thumbnail_url) {
      const fileId = extractFileIdFromUrl(existing.thumbnail_url);
      if (fileId) oldFileIds.add(fileId);
    }
    collectUploadedFileIds(parseContentJson(existing.content_json), oldFileIds);

    const newFileIds = new Set<string>();
    const resolvedThumbnailUrl = input.thumbnail_url !== undefined ? input.thumbnail_url : existing.thumbnail_url;
    if (resolvedThumbnailUrl) {
      const fileId = extractFileIdFromUrl(resolvedThumbnailUrl);
      if (fileId) newFileIds.add(fileId);
    }
    collectUploadedFileIds(input.content_json, newFileIds);

    // Anything referenced before the edit but not after — a removed inline
    // image, or the thumbnail being replaced — is now an orphan.
    const orphanedFileIds = Array.from(oldFileIds).filter((fileId) => !newFileIds.has(fileId));
    await Promise.all(orphanedFileIds.map((fileId) => storage.deleteFile({ bucketId: ASSETS_BUCKET_ID, fileId }).catch(() => {})));
  } catch {
    // Best-effort cleanup — a failure here shouldn't block saving the edit.
  }

  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: PROJECTS_TABLE_ID,
    rowId: id,
    data: projectInputToData(input),
  });
}

function extractFileIdFromUrl(url: string): string | null {
  const match = url.match(/\/buckets\/[^/]+\/files\/([^/]+)\//);
  return match ? match[1] : null;
}

// Walks BlockNote's block tree (including nested children) collecting every
// uploaded-file URL — covers image/file/video/audio blocks, which all store
// their URL at `props.url`.
function collectUploadedFileIds(node: unknown, ids: Set<string>) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectUploadedFileIds(item, ids));
    return;
  }
  if (!node || typeof node !== 'object') return;

  const block = node as { props?: { url?: unknown }; children?: unknown };
  if (typeof block.props?.url === 'string') {
    const fileId = extractFileIdFromUrl(block.props.url);
    if (fileId) ids.add(fileId);
  }
  if (block.children) collectUploadedFileIds(block.children, ids);
}

async function deleteProjectAssets(row: ProjectRow): Promise<void> {
  const fileIds = new Set<string>();
  if (row.thumbnail_url) {
    const fileId = extractFileIdFromUrl(row.thumbnail_url);
    if (fileId) fileIds.add(fileId);
  }
  collectUploadedFileIds(parseContentJson(row.content_json), fileIds);

  await Promise.all(
    Array.from(fileIds).map((fileId) => storage.deleteFile({ bucketId: ASSETS_BUCKET_ID, fileId }).catch(() => {}))
  );
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const row = await tablesDB.getRow<ProjectRow>({ databaseId: DATABASE_ID, tableId: PROJECTS_TABLE_ID, rowId: id });
    await deleteProjectAssets(row);
  } catch {
    // Best-effort cleanup — still delete the row even if asset cleanup fails.
  }
  await tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId: PROJECTS_TABLE_ID, rowId: id });
}

function toActiveProject(row: ActiveProjectRow): AdminActiveProject {
  return {
    id: row.$id,
    name: row.name ?? '',
    stage: row.stage ?? 0,
    display_order: row.display_order ?? 0,
    is_published: row.is_published ?? false,
    updated_at: row.$updatedAt,
  };
}

export async function listAdminActiveProjects(): Promise<AdminActiveProject[]> {
  const rows = await tablesDB.listRows<ActiveProjectRow>({
    databaseId: DATABASE_ID,
    tableId: ACTIVE_PROJECTS_TABLE_ID,
    queries: [Query.orderAsc('display_order'), Query.orderDesc('$updatedAt'), Query.limit(100)],
  });
  return rows.rows.map(toActiveProject);
}

export async function createActiveProject(input: ActiveProjectInput): Promise<string> {
  const row = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: ACTIVE_PROJECTS_TABLE_ID,
    rowId: ID.unique(),
    data: input,
  });
  return row.$id;
}

export async function updateActiveProject(id: string, input: ActiveProjectInput): Promise<void> {
  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: ACTIVE_PROJECTS_TABLE_ID,
    rowId: id,
    data: input,
  });
}

export async function deleteActiveProject(id: string): Promise<void> {
  await tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId: ACTIVE_PROJECTS_TABLE_ID, rowId: id });
}

export async function getAdminSiteSettings(): Promise<{ avatarUrl: string | null }> {
  const row = await tablesDB.getRow<Models.Row & { avatar_url: string | null }>({
    databaseId: DATABASE_ID,
    tableId: SITE_SETTINGS_TABLE_ID,
    rowId: 'main',
  });
  return { avatarUrl: row.avatar_url || null };
}

export async function updateSiteAvatar(avatarUrl: string): Promise<void> {
  try {
    const existing = await tablesDB.getRow<Models.Row & { avatar_url: string | null }>({
      databaseId: DATABASE_ID,
      tableId: SITE_SETTINGS_TABLE_ID,
      rowId: 'main',
    });
    if (existing.avatar_url) {
      const oldFileId = extractFileIdFromUrl(existing.avatar_url);
      if (oldFileId) await storage.deleteFile({ bucketId: ASSETS_BUCKET_ID, fileId: oldFileId }).catch(() => {});
    }
  } catch {
    // Best-effort cleanup — a failure here shouldn't block saving the edit.
  }

  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: SITE_SETTINGS_TABLE_ID,
    rowId: 'main',
    data: { avatar_url: avatarUrl },
  });
}

type MutualLinkRow = Models.Row & {
  name: string | null;
  url: string | null;
  description: string | null;
  banner_url: string | null;
  display_order: number | null;
};

export type AdminMutualLink = {
  id: string;
  name: string;
  url: string;
  description: string;
  banner_url: string | null;
  display_order: number;
};

export type MutualLinkInput = {
  name: string;
  url: string;
  description: string;
  banner_url: string | null;
  display_order: number;
};

function toMutualLink(row: MutualLinkRow): AdminMutualLink {
  return {
    id: row.$id,
    name: row.name ?? '',
    url: row.url ?? '',
    description: row.description ?? '',
    banner_url: row.banner_url ?? null,
    display_order: row.display_order ?? 0,
  };
}

export async function listAdminMutualLinks(): Promise<AdminMutualLink[]> {
  const rows = await tablesDB.listRows<MutualLinkRow>({
    databaseId: DATABASE_ID,
    tableId: MUTUAL_LINKS_TABLE_ID,
    queries: [Query.orderAsc('display_order'), Query.orderDesc('$updatedAt'), Query.limit(100)],
  });
  return rows.rows.map(toMutualLink);
}

export async function createMutualLink(input: MutualLinkInput): Promise<string> {
  const row = await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: MUTUAL_LINKS_TABLE_ID,
    rowId: ID.unique(),
    data: input,
  });
  return row.$id;
}

export async function updateMutualLink(id: string, input: MutualLinkInput): Promise<void> {
  if (input.banner_url !== undefined) {
    try {
      const existing = await tablesDB.getRow<MutualLinkRow>({ databaseId: DATABASE_ID, tableId: MUTUAL_LINKS_TABLE_ID, rowId: id });
      if (existing.banner_url && existing.banner_url !== input.banner_url) {
        const oldFileId = extractFileIdFromUrl(existing.banner_url);
        if (oldFileId) await storage.deleteFile({ bucketId: ASSETS_BUCKET_ID, fileId: oldFileId }).catch(() => {});
      }
    } catch {
      // Best-effort cleanup — a failure here shouldn't block saving the edit.
    }
  }

  await tablesDB.updateRow({
    databaseId: DATABASE_ID,
    tableId: MUTUAL_LINKS_TABLE_ID,
    rowId: id,
    data: input,
  });
}

export async function deleteMutualLink(id: string): Promise<void> {
  try {
    const row = await tablesDB.getRow<MutualLinkRow>({ databaseId: DATABASE_ID, tableId: MUTUAL_LINKS_TABLE_ID, rowId: id });
    if (row.banner_url) {
      const fileId = extractFileIdFromUrl(row.banner_url);
      if (fileId) await storage.deleteFile({ bucketId: ASSETS_BUCKET_ID, fileId }).catch(() => {});
    }
  } catch {
    // Best-effort cleanup — still delete the row even if asset cleanup fails.
  }
  await tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId: MUTUAL_LINKS_TABLE_ID, rowId: id });
}
