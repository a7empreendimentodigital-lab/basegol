"use client";

import { useCallback, useEffect, useState } from "react";
import { parseApiResponse } from "@/lib/api-client";
import { LiveMatchView } from "@/components/matches/LiveMatchView";
import type { MatchWithTeams } from "@/types";

type MatchPayload = {
  id: string;
  status: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  homePenaltyAttempts?: ("O" | "X")[];
  awayPenaltyAttempts?: ("O" | "X")[];
  penaltyAttempts?: { home: ("O" | "X")[]; away: ("O" | "X")[] };
  penaltyWinner?: "home" | "away" | null;
  matchPeriod?: string | null;
  currentPhase?: string | null;
  phaseDurationSeconds?: number;
  phaseElapsedSeconds?: number;
  phaseStartedAt?: string | null;
  isClockRunning?: boolean;
  periodsConfigured?: boolean;
  matchPeriodLabel?: string | null;
  showTotalGameTime?: boolean;
  minute: number | null;
  elapsedSeconds?: number;
  accumulatedPeriodSeconds?: number;
  clockRunning?: boolean;
  clockStartedAt?: string | null;
  inPenaltyShootout?: boolean;
  penaltyKicks?: { home: boolean[]; away: boolean[] };
  scheduledAt: string;
  venue: string | null;
  round: number;
  homeTeam: {
    id: string;
    club: { id: string; name: string; shortName: string | null; crestUrl: string | null };
  };
  awayTeam: {
    id: string;
    club: { id: string; name: string; shortName: string | null; crestUrl: string | null };
  };
  group?: {
    category?: { name?: string; championship?: { name?: string } };
  };
  events: {
    id: string;
    type: string;
    minute: number;
    extraMinute?: number | null;
    description?: string | null;
    athlete?: { firstName: string; lastName: string; photoUrl?: string | null } | null;
  }[];
  statistics?: {
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
  lineups?: unknown[];
};

function toMatchView(m: MatchPayload): MatchWithTeams {
  return {
    id: m.id,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homePenaltyScore: m.homePenaltyScore,
    awayPenaltyScore: m.awayPenaltyScore,
    homePenaltyAttempts: m.homePenaltyAttempts ?? m.penaltyAttempts?.home,
    awayPenaltyAttempts: m.awayPenaltyAttempts ?? m.penaltyAttempts?.away,
    penaltyAttempts: m.penaltyAttempts,
    penaltyWinner: m.penaltyWinner,
    matchPeriod: m.matchPeriod,
    currentPhase: m.currentPhase,
    phaseDurationSeconds: m.phaseDurationSeconds,
    phaseElapsedSeconds: m.phaseElapsedSeconds,
    phaseStartedAt: m.phaseStartedAt,
    isClockRunning: m.isClockRunning,
    periodsConfigured: m.periodsConfigured,
    matchPeriodLabel: m.matchPeriodLabel,
    showTotalGameTime: m.showTotalGameTime,
    minute: m.minute,
    elapsedSeconds: m.elapsedSeconds,
    accumulatedPeriodSeconds: m.accumulatedPeriodSeconds,
    clockRunning: m.isClockRunning ?? m.clockRunning,
    clockStartedAt: m.phaseStartedAt ?? m.clockStartedAt,
    inPenaltyShootout: m.inPenaltyShootout,
    penaltyKicks: m.penaltyKicks,
    scheduledAt: new Date(m.scheduledAt),
    venue: m.venue,
    round: m.round,
    championshipName: m.group?.category?.championship?.name ?? null,
    categoryName: m.group?.category?.name ?? null,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
  };
}

export function PublicLiveMatch({
  matchId,
  initialMatch,
  initialEvents,
  initialStats,
  categoryStandings = [],
}: {
  matchId: string;
  initialMatch: MatchWithTeams;
  initialEvents: MatchPayload["events"];
  initialStats: MatchPayload["statistics"];
  categoryStandings?: import("@/types").StandingRowDisplay[];
}) {
  const [match, setMatch] = useState(initialMatch);
  const [events, setEvents] = useState(initialEvents);
  const [stats, setStats] = useState(initialStats);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await parseApiResponse<MatchPayload>(res);
    if (!data) return;
    setMatch(toMatchView(data));
    setEvents(data.events ?? []);
    setStats(data.statistics ?? null);
  }, [matchId]);

  useEffect(() => {
    const interval = setInterval(() => void refresh(), 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <LiveMatchView
      match={match}
      events={events}
      stats={stats}
      standings={categoryStandings}
    />
  );
}
