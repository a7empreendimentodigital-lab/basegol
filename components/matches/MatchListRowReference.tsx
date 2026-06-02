import Link from "next/link";
import type { MatchWithTeams } from "@/types";
import { formatDate, formatTime } from "@/lib/utils";
import {
  formatLiveClock,
  formatRoundLabel,
} from "@/lib/match-display";
import { TeamCrest } from "@/components/matches/TeamCrest";
import { cn } from "@/lib/utils";

type Props = {
  match: MatchWithTeams;
  /** Exibe data completa no canto superior direito (próximos jogos). */
  showFullDate?: boolean;
};

function CenterBox({
  match,
  isLive,
  isFinished,
}: {
  match: MatchWithTeams;
  isLive: boolean;
  isFinished: boolean;
}) {
  const homePen = match.homePenaltyScore ?? 0;
  const awayPen = match.awayPenaltyScore ?? 0;
  const hasPenalties = homePen + awayPen > 0;
  const showScore = isLive || isFinished;

  if (isLive) {
    const clockLabel = formatLiveClock(match.status, match.minute, match);
    return (
      <div className="flex min-w-[4.5rem] flex-col items-center gap-1">
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-red-400">
          <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
          </span>
          Ao vivo
        </span>
        <span className="inline-flex min-w-[3.25rem] items-center justify-center rounded-md bg-[#2a2a2a] px-2.5 py-1 font-display text-lg tabular-nums leading-none text-foreground">
          {match.homeScore}
          <span className="mx-0.5 text-sm text-muted-foreground">:</span>
          {match.awayScore}
        </span>
      </div>
    );
  }

  if (showScore) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="inline-flex min-w-[3.25rem] items-center justify-center rounded-md bg-[#2a2a2a] px-2.5 py-1 font-display text-lg tabular-nums leading-none text-foreground sm:text-xl">
          {match.homeScore}
          <span className="mx-0.5 text-sm text-muted-foreground">:</span>
          {match.awayScore}
        </span>
        {hasPenalties && isFinished ? (
          <span className="text-[9px] font-medium tabular-nums text-muted-foreground">
            Pen. {homePen}:{awayPen}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <span className="inline-flex min-w-[3.25rem] items-center justify-center rounded-md bg-[#2a2a2a] px-2.5 py-1 text-sm font-semibold tabular-nums text-foreground">
      {formatTime(match.scheduledAt)}
    </span>
  );
}

/** Card no estilo de referência (AlertaGol): meta no topo + times nas pontas com horário/placar ao centro. */
export function MatchListRowReference({ match }: Props) {
  const homeName = match.homeTeam.club.shortName ?? match.homeTeam.club.name;
  const awayName = match.awayTeam.club.shortName ?? match.awayTeam.club.name;
  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const isFinished = match.status === "FINISHED";

  return (
    <Link
      href={`/jogos/${match.id}`}
      className={cn(
        "block w-full border-b border-line/50 bg-[#141414] px-4 py-4 transition-colors hover:bg-[#1a1a1a] sm:px-5 sm:py-4",
        isLive && "bg-red-500/[0.04] hover:bg-red-500/[0.06]"
      )}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {match.categoryName ? (
            <p className="font-display text-xl font-bold uppercase leading-none tracking-wide text-foreground">
              {match.categoryName}
            </p>
          ) : null}
          {match.championshipName ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{match.championshipName}</p>
          ) : null}
        </div>

        <div className="shrink-0 text-right text-xs leading-snug text-muted-foreground">
          <p className="whitespace-nowrap">
            {formatDate(match.scheduledAt, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          {match.round != null ? (
            <p className="mt-0.5 whitespace-nowrap"># {formatRoundLabel(match.round)}</p>
          ) : null}
        </div>
      </header>

      <div className="flex items-center gap-2 sm:gap-3">
        <span
          className="min-w-0 flex-1 truncate text-left text-xs font-medium text-foreground sm:text-sm"
          title={homeName}
        >
          {homeName}
        </span>
        <TeamCrest url={match.homeTeam.club.crestUrl} name={homeName} size="md" />
        <CenterBox match={match} isLive={isLive} isFinished={isFinished} />
        <TeamCrest url={match.awayTeam.club.crestUrl} name={awayName} size="md" />
        <span
          className="min-w-0 flex-1 truncate text-right text-xs font-medium text-foreground sm:text-sm"
          title={awayName}
        >
          {awayName}
        </span>
      </div>
    </Link>
  );
}
