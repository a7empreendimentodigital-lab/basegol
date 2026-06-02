"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  ListOrdered,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChampionshipEmptyPanel } from "@/components/campeonatos/ChampionshipEmptyPanel";
import { LiveBadge } from "@/components/layout/LiveBadge";
import { StatisticBar } from "@/components/matches/StatisticBar";
import { StandingTable } from "@/components/matches/StandingTable";
import { normalizeImageSrc } from "@/lib/image-url";
import { LiveMatchClockDisplay } from "@/components/matches/LiveMatchClockDisplay";
import { PenaltyShootoutPanel } from "@/components/matches/PenaltyShootoutPanel";
import { penaltyShootoutWinner } from "@/lib/match-penalties";
import { MATCH_EVENT_LABELS } from "@/lib/admin-labels";
import { MatchDetailMeta } from "@/components/matches/MatchDetailMeta";
import { MatchDetailScoreHeader } from "@/components/matches/MatchDetailScoreHeader";
import {
  dedupeTimelineEvents,
  formatTimelineMinute,
  timelineEventTitle,
} from "@/lib/match-timeline";
import { publicListShell, publicSectionBlock, publicSectionDivider, publicTabTriggerClassFlex } from "@/lib/public-ui-classes";
import { cn } from "@/lib/utils";
import type { MatchWithTeams, StandingRowDisplay } from "@/types";

type EventItem = {
  id: string;
  type: string;
  minute: number;
  extraMinute?: number | null;
  description?: string | null;
  athlete?: { firstName: string; lastName: string; photoUrl?: string | null } | null;
};

type LiveMatchViewProps = {
  match: MatchWithTeams;
  events?: EventItem[];
  stats?: {
    homePossession: number;
    awayPossession: number;
    homeShots: number;
    awayShots: number;
    homeShotsOnGoal: number;
    awayShotsOnGoal: number;
    homeFouls: number;
    awayFouls: number;
    homeCorners: number;
    awayCorners: number;
  } | null;
  standings?: StandingRowDisplay[];
};

function eventIcon(type: string) {
  switch (type) {
    case "GOAL":
    case "PENALTY_GOAL":
      return "⚽";
    case "PENALTY_MISS":
      return "✕";
    case "YELLOW_CARD":
      return "🟨";
    case "RED_CARD":
      return "🟥";
    case "SUBSTITUTION":
      return "↔";
    case "HALFTIME":
      return "⏸";
    case "FULLTIME":
      return "🏁";
    case "KICKOFF":
      return "▶";
    default:
      return "•";
  }
}

export function LiveMatchView({ match, events = [], stats, standings = [] }: LiveMatchViewProps) {
  const timelineEvents = dedupeTimelineEvents(events);
  const homeName = match.homeTeam.club.shortName ?? match.homeTeam.club.name;
  const awayName = match.awayTeam.club.shortName ?? match.awayTeam.club.name;
  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const hasStats = stats != null;
  const showPenalties =
    match.inPenaltyShootout ||
    match.hasPenaltyShootout === true ||
    match.currentPhase === "PENALTIES" ||
    match.matchPeriod === "PENALTY_SHOOTOUT" ||
    (match.homePenaltyScore ?? 0) + (match.awayPenaltyScore ?? 0) > 0;
  const penaltyWinner =
    match.penaltyWinner ??
    (showPenalties
      ? (() => {
          const w = penaltyShootoutWinner(
            match.homePenaltyScore ?? 0,
            match.awayPenaltyScore ?? 0
          );
          return w === "draw" ? null : w;
        })()
      : null);
  return (
    <div className="w-full space-y-5">
      <Link
        href="/jogos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Voltar aos jogos
      </Link>

      <div className={cn("space-y-4 text-center", publicSectionBlock, publicSectionDivider)}>
        {isLive ? (
          <div className="flex flex-col items-center gap-2">
            <LiveBadge />
            <LiveMatchClockDisplay match={match} size="lg" />
          </div>
        ) : null}

        <MatchDetailScoreHeader
          match={match}
          homeName={homeName}
          awayName={awayName}
          showRegulationLabel={showPenalties}
        />

        {showPenalties ? (
          <div className="w-full max-w-lg mx-auto space-y-3">
            <PenaltyShootoutPanel
              homeScore={match.homePenaltyScore ?? 0}
              awayScore={match.awayPenaltyScore ?? 0}
              homeAttempts={match.homePenaltyAttempts ?? match.penaltyAttempts?.home}
              awayAttempts={match.awayPenaltyAttempts ?? match.penaltyAttempts?.away}
              homeKicks={match.penaltyKicks?.home}
              awayKicks={match.penaltyKicks?.away}
              showKickSequence={
                (match.homePenaltyAttempts?.length ?? match.penaltyAttempts?.home?.length ?? 0) > 0 ||
                (match.awayPenaltyAttempts?.length ?? match.penaltyAttempts?.away?.length ?? 0) > 0 ||
                (match.penaltyKicks?.home?.length ?? 0) > 0 ||
                (match.penaltyKicks?.away?.length ?? 0) > 0
              }
            />
            {penaltyWinner ? (
              <p className="text-center text-sm font-medium text-neon">
                Vencedor: {penaltyWinner === "home" ? homeName : awayName}
              </p>
            ) : null}
          </div>
        ) : null}

        <MatchDetailMeta match={match} />
      </div>

      <Tabs defaultValue="eventos" className="w-full">
        <TabsList className="mb-4 flex h-auto w-full gap-2 bg-transparent p-0">
          <TabsTrigger value="eventos" className={publicTabTriggerClassFlex}>
            <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="tabela" disabled={standings.length === 0} className={publicTabTriggerClassFlex}>
            <ListOrdered className="h-4 w-4 shrink-0" aria-hidden />
            Classificação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="eventos" className="mt-0 space-y-5 focus-visible:ring-0">
          {hasStats && (
            <section className={cn("space-y-3", publicSectionBlock, publicSectionDivider)}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden />
                Estatísticas
              </h3>
              <StatisticBar
                label="Posse de bola"
                homeValue={stats.homePossession}
                awayValue={stats.awayPossession}
              />
              <StatisticBar label="Chutes" homeValue={stats.homeShots} awayValue={stats.awayShots} />
              <StatisticBar
                label="No gol"
                homeValue={stats.homeShotsOnGoal}
                awayValue={stats.awayShotsOnGoal}
              />
            </section>
          )}

          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ClipboardList className="h-4 w-4 text-muted-foreground" aria-hidden />
              Cronologia
            </h3>
            {timelineEvents.length === 0 ? (
              <ChampionshipEmptyPanel icon={ClipboardList} title="Nenhum evento ainda" />
            ) : (
              <div className={publicListShell}>
                {timelineEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 px-4 py-3 text-sm sm:px-5">
                    <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                      {formatTimelineMinute(ev)}
                    </span>
                    <span className="shrink-0 text-base">{eventIcon(ev.type)}</span>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {normalizeImageSrc(ev.athlete?.photoUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={normalizeImageSrc(ev.athlete?.photoUrl)!}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-lg object-cover"
                        />
                      ) : null}
                      <span className="truncate">
                        {ev.athlete
                          ? `${ev.athlete.firstName} ${ev.athlete.lastName}${
                              ev.description ? ` · ${ev.description}` : ""
                            }`
                          : timelineEventTitle(ev, MATCH_EVENT_LABELS)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="tabela" className="mt-0 focus-visible:ring-0">
          {standings.length > 0 ? (
            <StandingTable rows={standings} />
          ) : (
            <ChampionshipEmptyPanel icon={ListOrdered} title="Classificação indisponível" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
