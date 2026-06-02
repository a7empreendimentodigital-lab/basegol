import { formatTime } from "@/lib/utils";
import { TeamCrest } from "@/components/matches/TeamCrest";
import { cn } from "@/lib/utils";
import type { MatchWithTeams } from "@/types";

type Props = {
  match: MatchWithTeams;
  homeName: string;
  awayName: string;
  showRegulationLabel?: boolean;
};

export function MatchDetailScoreHeader({
  match,
  homeName,
  awayName,
  showRegulationLabel = false,
}: Props) {
  const isScheduled = match.status === "SCHEDULED" || match.status === "POSTPONED";

  return (
    <div className="flex items-center justify-center gap-5 sm:gap-10">
      <div className="flex min-w-0 max-w-[9rem] flex-1 flex-col items-center gap-2.5">
        <TeamCrest url={match.homeTeam.club.crestUrl} name={homeName} size="xl" />
        <p className="line-clamp-2 w-full text-center text-sm font-semibold leading-tight text-foreground sm:text-base">
          {homeName}
        </p>
      </div>

      <div className="shrink-0 px-2 text-center">
        {showRegulationLabel ? (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tempo regulamentar
          </p>
        ) : null}
        {isScheduled ? (
          <span
            className={cn(
              "inline-flex min-w-[4.5rem] items-center justify-center rounded-md bg-[#2a2a2a]",
              "px-3 py-2 font-display text-2xl font-semibold tabular-nums text-foreground sm:text-3xl"
            )}
          >
            {formatTime(match.scheduledAt)}
          </span>
        ) : (
          <p className="font-display text-4xl tracking-wider text-foreground tabular-nums sm:text-5xl">
            {match.homeScore}
            <span className="mx-1 text-muted-foreground">:</span>
            {match.awayScore}
          </p>
        )}
      </div>

      <div className="flex min-w-0 max-w-[9rem] flex-1 flex-col items-center gap-2.5">
        <TeamCrest url={match.awayTeam.club.crestUrl} name={awayName} size="xl" />
        <p className="line-clamp-2 w-full text-center text-sm font-semibold leading-tight text-foreground sm:text-base">
          {awayName}
        </p>
      </div>
    </div>
  );
}
