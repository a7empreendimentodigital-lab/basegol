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

  const banner = isLive
    ? { title: "Ao vivo", subtitle: "Acompanhe as partidas em andamento" }
    : isUpcoming
      ? { title: "Próximos jogos", subtitle: "Confira as partidas que estão por vir" }
      : { title: "Jogos de hoje", subtitle: "Todos os jogos programados para hoje" };

  const emptyMessage = isLive
    ? "Nenhuma partida ao vivo no momento."
    : isUpcoming
      ? "Nenhum jogo agendado nos próximos dias."
      : "Nenhum jogo programado para hoje.";

  return (
    <PublicRightSidebarLayout>
      <PublicPageBanner title={banner.title} subtitle={banner.subtitle} />

      <main className="w-full space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <JogosFilterTabs isLive={isLive} isUpcoming={isUpcoming} />

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
