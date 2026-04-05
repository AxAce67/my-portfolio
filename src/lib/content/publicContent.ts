import { unstable_cache } from 'next/cache';
import { createPublicServerClient } from '@/lib/supabase/public-server';

const PUBLIC_CONTENT_REVALIDATE_SECONDS = 30;

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

function createContentClient() {
  return createPublicServerClient();
}

async function fetchPublishedProjectsWithTags(limit?: number): Promise<HomeProject[]> {
  const supabase = createContentClient();
  let query = supabase
    .from('portfolio_projects')
    .select('id, title, description, thumbnail_url, created_at, updated_at')
    .eq('status', 'completed')
    .eq('is_published', true)
    .order('updated_at', { ascending: false });

  if (typeof limit === 'number') {
    query = query.limit(limit);
  }

  const { data: projectRows, error: projectError } = await query;
  if (projectError) {
    throw new Error(`Failed to load published projects: ${projectError.message}`);
  }
  const projectIds = (projectRows ?? []).map((row) => row.id);
  const { data: tagRows, error: tagError } = projectIds.length
    ? await supabase
        .from('portfolio_project_tags')
        .select('project_id, tag_name')
        .in('project_id', projectIds)
    : { data: [] as { project_id: string; tag_name: string }[], error: null };

  if (tagError) {
    throw new Error(`Failed to load project tags: ${tagError.message}`);
  }

  const tagsByProject = new Map<string, string[]>();
  (tagRows ?? []).forEach((tag) => {
    const current = tagsByProject.get(tag.project_id) ?? [];
    tagsByProject.set(tag.project_id, [...current, tag.tag_name]);
  });

  return (projectRows ?? []).map((row) => ({
    id: row.id,
    title: row.title ?? 'Untitled',
    description: row.description ?? '',
    thumbnail_url: row.thumbnail_url ?? null,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
    tags: tagsByProject.get(row.id) ?? [],
  }));
}

async function fetchPublishedActiveProjects(): Promise<HomeActiveProject[]> {
  const supabase = createContentClient();
  const { data: rows, error } = await supabase
    .from('portfolio_active_projects')
    .select('id, name, stage')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load active projects: ${error.message}`);
  }

  return (rows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    stage: row.stage,
  }));
}

export const getHomePageData = unstable_cache(
  async () => {
    const [projects, activeProjects] = await Promise.all([
      fetchPublishedProjectsWithTags(8),
      fetchPublishedActiveProjects(),
    ]);
    return { projects, activeProjects };
  },
  ['home-page-data-v2'],
  {
    tags: ['home-page-data'],
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
  }
);

export const getProjectsListData = unstable_cache(
  async () => fetchPublishedProjectsWithTags(),
  ['projects-list-data-v1'],
  {
    tags: ['home-page-data'],
    revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
  }
);

export async function getProjectById(id: string) {
  return unstable_cache(
    async () => {
      const supabase = createContentClient();
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('id, title, description, content_md, content_json, created_at, updated_at, is_published, thumbnail_url')
        .eq('id', id)
        .eq('is_published', true)
        .maybeSingle();

      if (error) {
        // Validation errors (e.g. invalid UUID format) → treat as not found
        if (error.code === '22P02') return null;
        throw new Error(`Failed to load project detail: ${error.message}`);
      }
      return data;
    },
    ['project-detail-data-v2', id],
    {
      tags: ['home-page-data', `project-detail:${id}`],
      revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
    }
  )();
}
