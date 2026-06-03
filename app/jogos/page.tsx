import { JogosCategoryTabs } from "@/components/jogos/JogosCategoryTabs";
import { JogosFilterTabs } from "@/components/jogos/JogosFilterTabs";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { MatchList } from "@/components/matches/MatchList";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { ChampionshipEmptyPanel } from "@/components/campeonatos/ChampionshipEmptyPanel";
import { Calendar } from "lucide-react";
import Link from "next/link";
import {
  extractCategoriesFromMatches,
  filterMatchesByCategorySlug,
  resolveActiveCategorySlug,
} from "@/lib/jogos-category-filter";
import { redirectGlobalRouteToPortalChampionship } from "@/lib/redirect-portal-championship";
import { getServerPortalChampionshipSlug } from "@/lib/portal-championship-context.server";

export const metadata = { title: "Jogos" };

export default async function JogosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; categoria?: string }>;
}) {
  const params = await searchParams;
  await redirectGlobalRouteToPortalChampionship("jogos", params);

  const championshipSlug = await getServerPortalChampionshipSlug();
  const { status, categoria: categoriaParam } = params;
  const isLive = status === "LIVE";
  const isUpcoming = status === "upcoming";

  const bannerTitle = isLive ? "Ao vivo" : isUpcoming ? "Próximos jogos" : "Jogos de hoje";

  if (!championshipSlug) {
    return (
      <PublicRightSidebarLayout>
        <PublicPageBanner title={bannerTitle} />
        <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          <ChampionshipEmptyPanel
            icon={Calendar}
            title="Selecione um campeonato"
            description="Escolha um campeonato na página inicial para ver jogos ao vivo, de hoje e próximos."
          />
          <p className="mt-4 text-center text-sm">
            <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
              Ir para campeonatos
            </Link>
          </p>
        </main>
      </PublicRightSidebarLayout>
    );
  }

  const { getChampionshipPortalBase } = await import("@/services/championship-portal.service");
  const {
    getLiveMatchesForChampionship,
    getTodayMatchesForChampionship,
    getUpcomingMatchesForChampionship,
  } = await import("@/services/match.service");

  const championship = await getChampionshipPortalBase(championshipSlug);
  if (!championship) {
    return (
      <PublicRightSidebarLayout>
        <PublicPageBanner title={bannerTitle} />
        <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          <ChampionshipEmptyPanel icon={Calendar} title="Campeonato não encontrado" />
        </main>
      </PublicRightSidebarLayout>
    );
  }

  const allMatches = isLive
    ? await getLiveMatchesForChampionship(championship.id)
    : isUpcoming
      ? await getUpcomingMatchesForChampionship(championship.id, undefined, 50)
      : await getTodayMatchesForChampionship(championship.id);

  const categories = extractCategoriesFromMatches(allMatches);
  const activeCategory = resolveActiveCategorySlug(categoriaParam, categories);
  const matches = filterMatchesByCategorySlug(allMatches, activeCategory ?? undefined);
  const basePath = `/campeonatos/${championshipSlug}/jogos`;

  const activeCategoryName =
    activeCategory != null
      ? categories.find((c) => c.slug === activeCategory)?.name ?? null
      : null;

  const statusFilter = isLive ? "LIVE" : isUpcoming ? "upcoming" : undefined;

  const emptyMessage =
    activeCategoryName != null
      ? `Nenhum jogo em ${activeCategoryName}${isLive ? " ao vivo" : isUpcoming ? " nos próximos dias" : " hoje"}.`
      : isLive
        ? "Nenhuma partida ao vivo neste campeonato."
        : isUpcoming
          ? "Nenhum jogo agendado nos próximos dias."
          : "Nenhum jogo programado para hoje neste campeonato.";

  return (
    <PublicRightSidebarLayout championshipSlug={championshipSlug}>
      <PublicPageBanner title={bannerTitle} />

      <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <div className="border-b border-line/60 pb-4 mb-0">
          <JogosFilterTabs
            isLive={isLive}
            isUpcoming={isUpcoming}
            activeCategory={activeCategory}
            basePath={basePath}
          />
        </div>

        <JogosCategoryTabs
          categories={categories}
          activeSlug={activeCategory}
          pathname={basePath}
          status={statusFilter}
        />

        <MatchList
          matches={matches}
          showFullDate={isUpcoming}
          emptyMessage={emptyMessage}
          variant={isLive ? "live" : isUpcoming ? "upcoming" : "today"}
        />
      </main>
    </PublicRightSidebarLayout>
  );
}
