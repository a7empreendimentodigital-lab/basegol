import { JogosCategoryTabs } from "@/components/jogos/JogosCategoryTabs";
import { JogosFilterTabs } from "@/components/jogos/JogosFilterTabs";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { MatchList } from "@/components/matches/MatchList";
import {
  extractCategoriesFromMatches,
  filterMatchesByCategorySlug,
  resolveActiveCategorySlug,
} from "@/lib/jogos-category-filter";
import { getChampionshipPortalBase } from "@/services/championship-portal.service";
import {
  getLiveMatchesForChampionship,
  getTodayMatchesForChampionship,
  getUpcomingMatchesForChampionship,
} from "@/services/match.service";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; categoria?: string }>;
};

export default async function ChampionshipJogosPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { status, categoria: categoriaParam } = await searchParams;

  const championship = await getChampionshipPortalBase(slug);
  if (!championship) notFound();

  const isLive = status === "LIVE";
  const isUpcoming = status === "upcoming";
  const basePath = `/campeonatos/${slug}/jogos`;

  const allMatches = isLive
    ? await getLiveMatchesForChampionship(championship.id)
    : isUpcoming
      ? await getUpcomingMatchesForChampionship(championship.id, undefined, 50)
      : await getTodayMatchesForChampionship(championship.id);

  const categories = extractCategoriesFromMatches(allMatches);
  const activeCategory = resolveActiveCategorySlug(categoriaParam, categories);
  const matches = filterMatchesByCategorySlug(allMatches, activeCategory ?? undefined);

  const bannerTitle = isLive ? "Ao vivo" : isUpcoming ? "Próximos jogos" : "Jogos de hoje";

  return (
    <PublicRightSidebarLayout championshipSlug={slug}>
      <PublicPageBanner title={bannerTitle} />
      <main className="w-full space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <JogosFilterTabs
          isLive={isLive}
          isUpcoming={isUpcoming}
          activeCategory={activeCategory}
          basePath={basePath}
        />
        <JogosCategoryTabs
          categories={categories}
          activeSlug={activeCategory}
          pathname={basePath}
          status={isLive ? "LIVE" : isUpcoming ? "upcoming" : undefined}
        />
        <MatchList
          matches={matches}
          emptyMessage={
            isLive
              ? "Nenhum jogo ao vivo neste campeonato."
              : isUpcoming
                ? "Nenhum jogo agendado nos próximos dias."
                : "Nenhum jogo hoje neste campeonato."
          }
        />
      </main>
    </PublicRightSidebarLayout>
  );
}
