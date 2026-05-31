import { JogosFilterTabs } from "@/components/jogos/JogosFilterTabs";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { MatchList } from "@/components/matches/MatchList";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { getLiveMatches, getTodayMatches, getUpcomingMatches } from "@/services/match.service";

export const metadata = { title: "Jogos" };

export default async function JogosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const isLive = status === "LIVE";
  const isUpcoming = status === "upcoming";

  const matches = isLive
    ? await getLiveMatches()
    : isUpcoming
      ? await getUpcomingMatches(50)
      : await getTodayMatches();

  const bannerTitle = isLive
    ? "Ao vivo"
    : isUpcoming
      ? "Próximos jogos"
      : "Jogos de hoje";

  const emptyMessage = isLive
    ? "Nenhuma partida ao vivo no momento."
    : isUpcoming
      ? "Nenhum jogo agendado nos próximos dias."
      : "Nenhum jogo programado para hoje.";

  return (
    <PublicRightSidebarLayout>
      <PublicPageBanner title={bannerTitle} />

      <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <div className="border-b border-line/60 pb-4 mb-0">
          <JogosFilterTabs isLive={isLive} isUpcoming={isUpcoming} />
        </div>

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
