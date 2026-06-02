import { HeroBannerCarousel } from "@/components/public/HeroBannerCarousel";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { HomeCategoriesRow } from "@/components/home/HomeCategoriesRow";
import { LiveMatchesSection } from "@/components/matches/LiveMatchesSection";
import { TodayMatchesSection } from "@/components/matches/TodayMatchesList";
import {
  extractCategoriesFromMatches,
  filterMatchesByCategorySlug,
  resolveActiveCategorySlug,
} from "@/lib/jogos-category-filter";
import { getLiveMatches, getTodayMatches } from "@/services/match.service";
import { HomeQuickLinks } from "@/components/home/HomeQuickLinks";
import { getPublicSiteConfig } from "@/lib/site-config";
import { getHomeCategoryCircles } from "@/services/home.service";
import { getHomeBanners } from "@/services/banner.service";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria: categoriaParam } = await searchParams;

  const [liveMatches, todayMatchesAll, publicConfig, categoryCircles, homeBanners] =
    await Promise.all([
      getLiveMatches(),
      getTodayMatches(),
      getPublicSiteConfig(),
      getHomeCategoryCircles(),
      getHomeBanners(),
    ]);

  const todayCategories = extractCategoriesFromMatches(todayMatchesAll);
  const activeTodayCategory = resolveActiveCategorySlug(categoriaParam, todayCategories);
  const todayMatches = filterMatchesByCategorySlug(
    todayMatchesAll,
    activeTodayCategory ?? undefined
  );

  const heroTitle =
    publicConfig.texts.find((t) => t.key === "home.hero.title")?.value ??
    "O FUTURO DO FUTEBOL PAULISTA COMEÇA AQUI";

  return (
    <PublicRightSidebarLayout>
      <main className="min-w-0 flex-1 space-y-6 overflow-x-hidden p-4 md:p-5 lg:p-6">
        <HeroBannerCarousel
          slides={homeBanners.hero}
          fallbackTitle={heroTitle}
          fallbackSubtitle={publicConfig.brand?.slogan ?? undefined}
          fallbackBackgroundUrl={publicConfig.brand?.homeHeroBackgroundUrl ?? null}
        />

        <LiveMatchesSection matches={liveMatches} />

        {todayMatchesAll.length > 0 ? (
          <TodayMatchesSection
            matches={todayMatches}
            categories={todayCategories}
            activeCategory={activeTodayCategory}
          />
        ) : null}

        <HomeCategoriesRow categories={categoryCircles} />

        <HomeQuickLinks />
      </main>
    </PublicRightSidebarLayout>
  );
}
