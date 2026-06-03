import { HeroBannerCarousel } from "@/components/public/HeroBannerCarousel";
import { HomeCategoriesRow } from "@/components/home/HomeCategoriesRow";
import { HomeQuickLinks } from "@/components/home/HomeQuickLinks";
import { LiveMatchesSection } from "@/components/matches/LiveMatchesSection";
import { TodayMatchesSection } from "@/components/matches/TodayMatchesList";
import {
  extractCategoriesFromMatches,
  filterMatchesByCategorySlug,
  resolveActiveCategorySlug,
} from "@/lib/jogos-category-filter";
import { championshipPublicBase } from "@/lib/championship-public-nav";
import { getPublicSiteConfig } from "@/lib/site-config";
import {
  getHomeCategoryCirclesForChampionship,
} from "@/services/home.service";
import {
  getLiveMatchesForChampionship,
  getTodayMatchesForChampionship,
} from "@/services/match.service";

type Props = {
  championshipId: string;
  championshipSlug: string;
  championshipName: string;
  bannerUrl?: string | null;
  description?: string | null;
  categoriaParam?: string;
};

export async function ChampionshipHomeDashboard({
  championshipId,
  championshipSlug,
  championshipName,
  bannerUrl,
  description,
  categoriaParam,
}: Props) {
  const base = championshipPublicBase(championshipSlug);

  const [liveMatches, todayMatchesAll, publicConfig, categoryCircles] = await Promise.all([
    getLiveMatchesForChampionship(championshipId),
    getTodayMatchesForChampionship(championshipId),
    getPublicSiteConfig(),
    getHomeCategoryCirclesForChampionship(championshipId),
  ]);

  const todayCategories = extractCategoriesFromMatches(todayMatchesAll);
  const activeTodayCategory = resolveActiveCategorySlug(categoriaParam, todayCategories);
  const todayMatches = filterMatchesByCategorySlug(
    todayMatchesAll,
    activeTodayCategory ?? undefined
  );

  const heroTitle =
    publicConfig.texts.find((t) => t.key === "home.hero.title")?.value ??
    championshipName.toUpperCase();

  return (
    <main className="min-w-0 flex-1 space-y-6 overflow-x-hidden p-4 md:p-5 lg:p-6">
      <HeroBannerCarousel
        slides={[]}
        fallbackTitle={heroTitle}
        fallbackSubtitle={description ?? publicConfig.brand?.slogan ?? undefined}
        fallbackBackgroundUrl={bannerUrl ?? null}
        fallbackCtaHref={`${base}/jogos`}
        fallbackCtaLabel="Ver jogos"
      />

      <LiveMatchesSection
        matches={liveMatches}
        verTodosHref={`${base}/jogos?status=LIVE`}
      />

      {todayMatchesAll.length > 0 ? (
        <TodayMatchesSection
          matches={todayMatches}
          categories={todayCategories}
          activeCategory={activeTodayCategory}
          pathname={base}
          allMatchesHref={`${base}/jogos`}
        />
      ) : null}

      <HomeCategoriesRow
        categories={categoryCircles}
        championshipSlug={championshipSlug}
      />

      <HomeQuickLinks championshipSlug={championshipSlug} />
    </main>
  );
}
