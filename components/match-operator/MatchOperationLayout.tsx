import { notFound } from "next/navigation";
import { getMatchById } from "@/services/match.service";
import { MatchOperationNav } from "@/components/match-operator/MatchOperationNav";

type Props = {
  matchId: string;
  basePath: string;
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
};

export async function MatchOperationLayout({
  matchId,
  basePath,
  backHref,
  backLabel,
  children,
}: Props) {
  const match = await getMatchById(matchId);
  if (!match) notFound();

  return (
    <div>
      <MatchOperationNav
        matchId={matchId}
        homeName={match.homeTeam.club.name}
        awayName={match.awayTeam.club.name}
        homeCrest={match.homeTeam.club.crestUrl}
        awayCrest={match.awayTeam.club.crestUrl}
        basePath={basePath}
        backHref={backHref}
        backLabel={backLabel}
        initial={{
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          minute: match.minute,
        }}
      />
      {children}
    </div>
  );
}
