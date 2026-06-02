import { JogosCategoryTabs } from "@/components/jogos/JogosCategoryTabs";
import { JogosFilterTabs } from "@/components/jogos/JogosFilterTabs";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { MatchList } from "@/components/matches/MatchList";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import {
  extractCategoriesFromMatches,
  filterMatchesByCategorySlug,
  resolveActiveCategorySlug,
} from "@/lib/jogos-category-filter";
import { getLiveMatches, getTodayMatches, getUpcomingMatches } from "@/services/match.service";

export const metadata = { title: "Jogos" };

export default async function JogosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; categoria?: string }>;
}) {
  const { status, categoria: categoriaParam } = await searchParams;
  const isLive = status === "LIVE";
  const isUpcoming = status === "upcoming";

  const allMatches = isLive
    ? await getLiveMatches()
    : isUpcoming
      ? await getUpcomingMatches(50)
      : await getTodayMatches();

  const categories = extractCategoriesFromMatches(allMatches);
  const activeCategory = resolveActiveCategorySlug(categoriaParam, categories);

  const matches = filterMatchesByCategorySlug(allMatches, activeCategory ?? undefined);

  const activeCategoryName =
    activeCategory != null
      ? categories.find((c) => c.slug === activeCategory)?.name ?? null
      : null;

  const statusFilter = isLive ? "LIVE" : isUpcoming ? "upcoming" : undefined;

  const bannerTitle = isLive
    ? "Ao vivo"
    : isUpcoming
      ? "Próximos jogos"
      : "Jogos de hoje";

  const emptyMessage =
    activeCategoryName != null
      ? `Nenhum jogo em ${activeCategoryName}${isLive ? " ao vivo" : isUpcoming ? " nos próximos dias" : " hoje"}.`
      : isLive
        ? "Nenhuma partida ao vivo no momento."
        : isUpcoming
          ? "Nenhum jogo agendado nos próximos dias."
          : "Nenhum jogo programado para hoje.";

  return (
    <PublicRightSidebarLayout>
      <PublicPageBanner title={bannerTitle} />

      <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <div className="border-b border-line/60 pb-4 mb-0">
          <JogosFilterTabs
            isLive={isLive}
            isUpcoming={isUpcoming}
            activeCategory={activeCategory}
          />
        </div>

        <JogosCategoryTabs
          categories={categories}
          activeSlug={activeCategory}
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
