import type { Metadata } from 'next';
import { getValidLocale } from '@/i18n/locales';
import { createPageMetadata } from '@/lib/metadata';
import { createHomeJsonLd, serializeJsonLd } from '@/lib/structuredData';
import { DEFAULT_AVATAR_URL, getHomePageData, getMutualLinks, getSiteSettings } from '@/lib/content/publicContent';
import HomePage from '@/views/HomePage';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata(getValidLocale(locale), 'home');
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  const appLocale = getValidLocale(locale);
  const [homeData, siteSettings, mutualLinks] = await Promise.all([
    getHomePageData(),
    getSiteSettings(),
    getMutualLinks(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(createHomeJsonLd(appLocale)) }}
      />
      <HomePage
        projects={homeData.projects}
        activeProjects={homeData.activeProjects}
        avatarUrl={siteSettings.avatarUrl ?? DEFAULT_AVATAR_URL}
        mutualLinks={mutualLinks}
      />
    </>
  );
}
