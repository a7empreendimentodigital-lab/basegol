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
import { TeamCrest } from "@/components/matches/TeamCrest";
import { formatLiveClock, formatMatchDateTime, formatRoundLabel } from "@/lib/match-display";
import { publicTabTriggerClassFlex } from "@/lib/public-ui-classes";
import { formatTime } from "@/lib/utils";
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

function formatMinute(minute: number, extra?: number | null) {
  if (extra && extra > 0) return `${minute}+${extra}'`;
  return `${minute}'`;
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
  const homeName = match.homeTeam.club.shortName ?? match.homeTeam.club.name;
  const awayName = match.awayTeam.club.shortName ?? match.awayTeam.club.name;
  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const hasStats = stats != null;
  const clockLabel = isLive ? formatLiveClock(match.status, match.minute) : null;

  return (
    <div className="w-full space-y-6">
      <Link
        href="/jogos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Voltar aos jogos
      </Link>

      <div className="space-y-5 rounded-2xl border border-line bg-graphite-light p-5 text-center sm:p-6">
        <div className="flex flex-col items-center gap-2">
          {isLive ? (
            <>
              <LiveBadge />
              {clockLabel && clockLabel !== "Ao vivo" ? (
                <span className="font-mono text-sm text-red-400 tabular-nums">{clockLabel}</span>
              ) : match.minute != null ? (
                <span className="font-mono text-sm text-red-400 tabular-nums">{match.minute}&apos;</span>
              ) : null}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 opacity-70" aria-hidden />
              {formatTime(match.scheduledAt)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-center gap-5 sm:gap-10">
          <div className="flex min-w-0 max-w-[9rem] flex-1 flex-col items-center gap-2.5">
            <TeamCrest url={match.homeTeam.club.crestUrl} name={homeName} size="xl" />
            <p className="line-clamp-2 w-full text-center text-sm font-semibold leading-tight text-foreground sm:text-base">
              {homeName}
            </p>
          </div>

          <p className="shrink-0 font-display text-4xl tracking-wider text-foreground tabular-nums sm:text-5xl">
            {match.homeScore}
            <span className="mx-1 text-muted-foreground">-</span>
            {match.awayScore}
          </p>

          <div className="flex min-w-0 max-w-[9rem] flex-1 flex-col items-center gap-2.5">
            <TeamCrest url={match.awayTeam.club.crestUrl} name={awayName} size="xl" />
            <p className="line-clamp-2 w-full text-center text-sm font-semibold leading-tight text-foreground sm:text-base">
              {awayName}
            </p>
          </div>
        </div>

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
            {events.length === 0 ? (
              <ChampionshipEmptyPanel
                icon={ClipboardList}
                title="Nenhum evento registrado ainda"
                description="Gols, cartões e substituições aparecerão aqui durante a partida."
              />
            ) : (
              <div className="divide-y divide-[#a1a1aa17] overflow-hidden rounded-2xl border border-line bg-graphite-light">
                {events.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 px-4 py-3 text-sm sm:px-5">
                    <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                      {formatMinute(ev.minute, ev.extraMinute)}
                    </span>
                    <span className="shrink-0 text-base">{eventIcon(ev.type)}</span>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {ev.athlete?.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ev.athlete.photoUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-lg object-cover"
                        />
                      ) : null}
                      <span className="truncate">
                        {ev.description ??
                          (ev.athlete
                            ? `${ev.athlete.firstName} ${ev.athlete.lastName}`
                            : ev.type.replace(/_/g, " "))}
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
            <ChampionshipEmptyPanel
              icon={ListOrdered}
              title="Classificação indisponível"
              description="A tabela desta categoria ainda não foi publicada."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
