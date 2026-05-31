"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ClipboardList,
  Hash,
  ListOrdered,
  MapPin,
  Tag,
  Trophy,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChampionshipEmptyPanel } from "@/components/campeonatos/ChampionshipEmptyPanel";
import { LiveBadge } from "@/components/layout/LiveBadge";
import { StatisticBar } from "@/components/matches/StatisticBar";
import { StandingTable } from "@/components/matches/StandingTable";
import { normalizeImageSrc } from "@/lib/image-url";
import { TeamCrest } from "@/components/matches/TeamCrest";
import { LiveMatchClockDisplay } from "@/components/matches/LiveMatchClockDisplay";
import { PenaltyShootoutPanel } from "@/components/matches/PenaltyShootoutPanel";
import { penaltyShootoutWinner } from "@/lib/match-penalties";
import { MATCH_EVENT_LABELS } from "@/lib/admin-labels";
import { formatMatchDateTime, formatRoundLabel } from "@/lib/match-display";
import {
  dedupeTimelineEvents,
  formatTimelineMinute,
  timelineEventTitle,
} from "@/lib/match-timeline";
import { publicTabTriggerClassFlex } from "@/lib/public-ui-classes";
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

function MatchMetaRow({
  icon: Icon,
  children,
}: {
  icon: typeof Calendar;
  children: ReactNode;
}) {
  return (
    <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
      <span>{children}</span>
    </p>
  );
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

      <div className="space-y-4 rounded-2xl border border-line bg-graphite-light p-4 text-center sm:p-5">
        {isLive ? (
          <div className="flex flex-col items-center gap-2">
            <LiveBadge />
            <LiveMatchClockDisplay match={match} size="lg" />
          </div>
        ) : null}

        <div className="flex items-center justify-center gap-5 sm:gap-10">
          <div className="flex min-w-0 max-w-[9rem] flex-1 flex-col items-center gap-2.5">
            <TeamCrest url={match.homeTeam.club.crestUrl} name={homeName} size="xl" />
            <p className="line-clamp-2 w-full text-center text-sm font-semibold leading-tight text-foreground sm:text-base">
              {homeName}
            </p>
          </div>

          <div className="shrink-0 text-center px-2">
            {showPenalties ? (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Tempo regulamentar
              </p>
            ) : null}
            <p className="font-display text-4xl tracking-wider text-foreground tabular-nums sm:text-5xl">
              {match.homeScore}
              <span className="mx-1 text-muted-foreground">:</span>
              {match.awayScore}
            </p>
          </div>

          <div className="flex min-w-0 max-w-[9rem] flex-1 flex-col items-center gap-2.5">
            <TeamCrest url={match.awayTeam.club.crestUrl} name={awayName} size="xl" />
            <p className="line-clamp-2 w-full text-center text-sm font-semibold leading-tight text-foreground sm:text-base">
              {awayName}
            </p>
          </div>
        </div>

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

        <div className="space-y-1.5 border-t border-line/60 pt-4">
          <MatchMetaRow icon={Calendar}>{formatMatchDateTime(match.scheduledAt)}</MatchMetaRow>
          {match.championshipName ? (
            <MatchMetaRow icon={Trophy}>
              {match.championshipName}
              {match.categoryName ? ` · ${match.categoryName}` : ""}
            </MatchMetaRow>
          ) : match.categoryName ? (
            <MatchMetaRow icon={Tag}>{match.categoryName}</MatchMetaRow>
          ) : null}
          {match.round ? (
            <MatchMetaRow icon={Hash}>{formatRoundLabel(match.round)}</MatchMetaRow>
          ) : null}
          {match.venue ? <MatchMetaRow icon={MapPin}>{match.venue}</MatchMetaRow> : null}
        </div>
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
            <section className="space-y-3 rounded-2xl border border-line bg-graphite-light p-4 sm:p-5">
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
              <div className="divide-y divide-[#a1a1aa17] overflow-hidden rounded-2xl border border-line bg-graphite-light">
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
