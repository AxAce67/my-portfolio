'use client';

import { useState } from 'react';
import HomeBento from '@/components/home/HomeBento';
import HomePageSections from '@/components/home/HomePageSections';
import type { HomeProject, MutualLink } from '@/lib/content/publicContent';
import { navigationStateKeys, readSessionValue } from '@/lib/navigationState';
import { useHomeNavigationRestoration } from '@/hooks/useHomeNavigationRestoration';

type Props = {
  projects: HomeProject[];
  avatarUrl: string;
  mutualLinks: MutualLink[];
};

// Data is loaded on the server (src/app/[locale]/page.tsx) so the first HTML
// already contains the projects, avatar and links.
export default function HomePage({ projects, avatarUrl, mutualLinks }: Props) {
  const [returningProjectId] = useState(() => {
    return readSessionValue(navigationStateKeys.returnToProjects) === '1'
      ? readSessionValue(navigationStateKeys.homeFromProjectId)
      : null;
  });

  useHomeNavigationRestoration(returningProjectId, true);

  return (
    <>
      <HomeBento avatarUrl={avatarUrl} projects={projects} />
      <HomePageSections
        initialCompletedProjects={projects}
        mutualLinks={mutualLinks}
        returningProjectId={returningProjectId}
      />
    </>
  );
}
