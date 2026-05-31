"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, Trophy } from "lucide-react";
import type { MatchWithTeams } from "@/types";
import { LiveMatchClockDisplay } from "@/components/matches/LiveMatchClockDisplay";
import { formatMatchDateTime, matchProgressPercent } from "@/lib/match-display";
import { TeamCrest } from "@/components/matches/TeamCrest";

export function LiveMatchCard({ match }: { match: MatchWithTeams }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!match.clockRunning) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [match.clockRunning, match.clockStartedAt, match.elapsedSeconds]);
  const homeName = match.homeTeam.club.shortName ?? match.homeTeam.club.name;
  const awayName = match.awayTeam.club.shortName ?? match.awayTeam.club.name;
  const progress = matchProgressPercent(match.status, match.minute, match, now);
  const competition =
    match.championshipName?.toUpperCase() ?? match.categoryName?.toUpperCase() ?? "CAMPEONATO";

  return (
    <article className="flex w-[min(100%,300px)] shrink-0 flex-col gap-4 rounded-2xl border border-line bg-graphite-light p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
            {competition}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
            {formatMatchDateTime(match.scheduledAt)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <LiveMatchClockDisplay match={match} size="sm" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <TeamCrest url={match.homeTeam.club.crestUrl} name={homeName} size="xl" />
          <span className="w-full truncate text-center text-xs font-medium text-foreground">
            {homeName}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 px-1">
          <span className="font-display text-4xl leading-none text-foreground tabular-nums">
            {match.homeScore}
          </span>
          <span className="text-lg text-muted-foreground">:</span>
          <span className="font-display text-4xl leading-none text-foreground tabular-nums">
            {match.awayScore}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <TeamCrest url={match.awayTeam.club.crestUrl} name={awayName} size="xl" />
          <span className="w-full truncate text-center text-xs font-medium text-foreground">
            {awayName}
          </span>
        </div>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-pitch">
        <div
          className="h-full rounded-full bg-foreground/60 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Link
        href={`/jogos/${match.id}`}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-graphite py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
      >
        <Play className="h-4 w-4 fill-current" aria-hidden />
        Assistir ao vivo
      </Link>
    </article>
  );
}
