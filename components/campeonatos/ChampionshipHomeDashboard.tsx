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
  bannerUrl?: string | null;
  categoriaParam?: string;
};

export async function ChampionshipHomeDashboard({
  championshipId,
  championshipSlug,
  bannerUrl,
  categoriaParam,
}: Props) {
  const base = championshipPublicBase(championshipSlug);

  const [liveMatches, todayMatchesAll, categoryCircles] = await Promise.all([
    getLiveMatchesForChampionship(championshipId),
    getTodayMatchesForChampionship(championshipId),
    getHomeCategoryCirclesForChampionship(championshipId),
  ]);

  const todayCategories = extractCategoriesFromMatches(todayMatchesAll);
  const activeTodayCategory = resolveActiveCategorySlug(categoriaParam, todayCategories);
  const todayMatches = filterMatchesByCategorySlug(
    todayMatchesAll,
    activeTodayCategory ?? undefined
  );

  return (
    <main className="min-w-0 flex-1 space-y-6 overflow-x-hidden p-4 md:p-5 lg:p-6">
      <HeroBannerCarousel
        slides={[]}
        fallbackBackgroundUrl={bannerUrl ?? null}
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
