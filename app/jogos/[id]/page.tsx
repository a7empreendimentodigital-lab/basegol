import { PublicLiveMatch } from "@/components/matches/PublicLiveMatch";
import { getMatchById } from "@/services/match.service";
import { getStandingsForCategory } from "@/services/statistics.service";
import { notFound } from "next/navigation";
import type { MatchWithTeams } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) return { title: "Partida" };
  return {
    title: `${match.homeTeam.club.name} x ${match.awayTeam.club.name}`,
  };
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbMatch = await getMatchById(id);
  if (!dbMatch) notFound();

  const categoryId = dbMatch.group?.category?.id;
  const categoryStandings = categoryId ? await getStandingsForCategory(categoryId) : [];

  const match: MatchWithTeams = {
    id: dbMatch.id,
    status: dbMatch.status,
    homeScore: dbMatch.homeScore,
    awayScore: dbMatch.awayScore,
    minute: dbMatch.minute,
    scheduledAt: dbMatch.scheduledAt,
    venue: dbMatch.venue,
    round: dbMatch.round,
    championshipName: dbMatch.group?.category?.championship?.name ?? null,
    categoryName: dbMatch.group?.category?.name ?? null,
    homeTeam: {
      id: dbMatch.homeTeam.id,
      club: {
        id: dbMatch.homeTeam.club.id,
        name: dbMatch.homeTeam.club.name,
        shortName: dbMatch.homeTeam.club.shortName,
        crestUrl: dbMatch.homeTeam.club.crestUrl,
      },
    },
    awayTeam: {
      id: dbMatch.awayTeam.id,
      club: {
        id: dbMatch.awayTeam.club.id,
        name: dbMatch.awayTeam.club.name,
        shortName: dbMatch.awayTeam.club.shortName,
        crestUrl: dbMatch.awayTeam.club.crestUrl,
      },
    },
  };

  return (
    <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <PublicLiveMatch
        matchId={id}
        initialMatch={match}
        initialEvents={dbMatch.events}
        initialStats={dbMatch.statistics}
        categoryStandings={categoryStandings}
      />
    </main>
  );
}
