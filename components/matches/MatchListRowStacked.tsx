import Link from "next/link";
import { Hash, Trophy } from "lucide-react";
import type { MatchWithTeams } from "@/types";
import { formatTime } from "@/lib/utils";
import {
  formatLiveClock,
  formatMatchDateShort,
  formatRoundLabel,
} from "@/lib/match-display";
import { TeamCrest } from "@/components/matches/TeamCrest";
import { publicListRow } from "@/lib/public-ui-classes";
import { cn } from "@/lib/utils";

type Props = {
  match: MatchWithTeams;
  showFullDate?: boolean;
};

function MatchScoreBlock({ match, isLive }: { match: MatchWithTeams; isLive: boolean }) {
  const isFinished = match.status === "FINISHED";
  const showScore = isLive || isFinished;
  const homePen = match.homePenaltyScore ?? 0;
  const awayPen = match.awayPenaltyScore ?? 0;
  const hasPenalties = homePen + awayPen > 0;

  if (!showScore) {
    return (
      <span className="font-display text-lg text-muted-foreground sm:text-xl" aria-hidden>
        ×
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="whitespace-nowrap font-display text-[2.5rem] tabular-nums leading-none text-foreground">
        {match.homeScore}
        <span className="mx-1.5 font-sans text-xl text-muted-foreground/80">:</span>
        {match.awayScore}
      </span>
      {hasPenalties && isFinished ? (
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
          Pênaltis {homePen}:{awayPen}
        </span>
      ) : null}
    </div>
  );
}

function TeamSide({ name, crestUrl }: { name: string; crestUrl?: string | null }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <TeamCrest url={crestUrl ?? null} name={name} size="match" />
      <span
        className="max-w-[8.5rem] text-sm font-semibold leading-snug text-foreground line-clamp-2 sm:max-w-[10rem] sm:text-base"
        title={name}
      >
        {name}
      </span>
    </div>
  );
}

export function MatchListRowStacked({ match, showFullDate = false }: Props) {
  const homeName = match.homeTeam.club.shortName ?? match.homeTeam.club.name;
  const awayName = match.awayTeam.club.shortName ?? match.awayTeam.club.name;
  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const isFinished = match.status === "FINISHED";
  const clockLabel = isLive ? formatLiveClock(match.status, match.minute, match) : null;
  const showDate = showFullDate || isFinished;

  const statusLabel = isLive
    ? "Ao vivo"
    : isFinished
      ? "Finalizado"
      : formatTime(match.scheduledAt);

  const competitionParts = [
    match.championshipName,
    match.round != null ? formatRoundLabel(match.round) : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/jogos/${match.id}`}
      className={cn(publicListRow, isLive && "bg-red-500/[0.03] hover:bg-red-500/[0.06]")}
    >
      <div className="space-y-4 sm:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {showDate ? (
              <time
                dateTime={new Date(match.scheduledAt).toISOString()}
                className="text-xs text-muted-foreground"
              >
                {formatMatchDateShort(match.scheduledAt)}
              </time>
            ) : null}
            {showDate ? (
              <span className="text-muted-foreground/50" aria-hidden>
                ·
              </span>
            ) : null}
            <span
              className={cn(
                "text-xs font-semibold",
                isLive ? "text-red-400" : isFinished ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {isLive && clockLabel && clockLabel !== "Ao vivo" ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
                  </span>
                  {clockLabel}
                </span>
              ) : (
                statusLabel
              )}
            </span>
          </div>
          {match.categoryName ? (
            <span className="shrink-0 rounded-full border border-line/70 bg-pitch/40 px-2.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-foreground">
              {match.categoryName}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-1 sm:gap-8 sm:px-2">
          <TeamSide name={homeName} crestUrl={match.homeTeam.club.crestUrl} />
          <MatchScoreBlock match={match} isLive={isLive} />
          <TeamSide name={awayName} crestUrl={match.awayTeam.club.crestUrl} />
        </div>

        {competitionParts.length > 0 ? (
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] leading-relaxed text-muted-foreground sm:justify-start">
            {match.championshipName ? (
              <span className="inline-flex max-w-full items-center gap-1 min-w-0">
                <Trophy className="h-3 w-3 shrink-0 opacity-50" aria-hidden />
                <span className="truncate">{match.championshipName}</span>
              </span>
            ) : null}
            {match.championshipName && match.round != null ? (
              <span className="text-muted-foreground/40" aria-hidden>
                ·
              </span>
            ) : null}
            {match.round != null ? (
              <span className="inline-flex items-center gap-1 shrink-0">
                <Hash className="h-3 w-3 opacity-50" aria-hidden />
                {formatRoundLabel(match.round)}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
