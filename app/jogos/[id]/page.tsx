import { PublicLiveMatch } from "@/components/matches/PublicLiveMatch";
import { getMatchById, getMatchDetailForApi, toMatchWithTeams } from "@/services/match.service";
import { getStandingsForCategory } from "@/services/statistics.service";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbMatch = await getMatchById(id);
  if (!dbMatch) return { title: "Partida" };
  return {
    title: `${dbMatch.homeTeam.club.name} x ${dbMatch.awayTeam.club.name}`,
  };
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbMatch = await getMatchDetailForApi(id);
  if (!dbMatch) notFound();

  const match = toMatchWithTeams(dbMatch);
  if (!match) notFound();

  const categoryId = dbMatch.group?.category?.id;
  const categoryStandings = categoryId ? await getStandingsForCategory(categoryId) : [];

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
