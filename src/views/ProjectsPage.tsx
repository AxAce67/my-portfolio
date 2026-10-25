import ProjectsListClient, { type ProjectListItem } from '@/components/projects/ProjectsListClient';
import type { HomeProject } from '@/lib/content/publicContent';

// Rows are loaded on the server (src/app/[locale]/projects/page.tsx) so the
// list is part of the first HTML.
export default function ProjectsPage({ rows }: { rows: HomeProject[] }) {
  const projects: ProjectListItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags,
  }));

  return <ProjectsListClient projects={projects} />;
}
