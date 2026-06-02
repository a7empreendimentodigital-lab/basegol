import { JogosCategoryTabs } from "@/components/jogos/JogosCategoryTabs";
import { JogosFilterTabs } from "@/components/jogos/JogosFilterTabs";
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

  const statusFilter = isLive ? "LIVE" : isUpcoming ? "upcoming" : undefined;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
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
        status={statusFilter}
        embedded
      />
      <div className="mt-6">
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
      </div>
    </main>
  );
}
