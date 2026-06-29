'use client';

import { useEffect, useState } from 'react';
import ProjectsListClient, { type ProjectListItem } from '@/components/projects/ProjectsListClient';
import { getProjectsListData } from '@/lib/content/publicContent';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjectsListData().then((rows) => {
      const mapped: ProjectListItem[] = rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        thumbnailUrl: row.thumbnail_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        tags: row.tags,
      }));
      setProjects(mapped);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  return <ProjectsListClient projects={projects} />;
}
