import { prisma } from "@/lib/prisma";
import {
  resolveCurrentPhase,
  resolvePhaseElapsed,
  resolveTotalPeriods,
  isTimedPhase,
  type MatchPhaseFields,
} from "@/lib/match-phase";
import {
  rebuildScoresFromEvents,
  resolveElapsedSeconds,
  resolveMatchPeriodForDisplay,
  shouldMatchClockBeRunning,
  type MatchEventLike,
} from "@/lib/match-live";
import {
  attemptsToBooleans,
  penaltyShootoutWinner,
} from "@/lib/match-penalties";
import {
  buildSyncPhaseClockData,
  enrichMatchPhaseFields,
} from "@/services/match-phase.service";
import type { MatchPeriod } from "@prisma/client";

type MatchWithRelations = {
  id: string;
  status: string;
  matchPeriod: string;
  currentPhase?: string;
  isClockRunning?: boolean;
  phaseElapsedSeconds?: number;
  phaseDurationSeconds?: number;
  phaseStartedAt?: Date | null;
  periodsConfigured?: boolean;
  totalPeriods?: number;
  hasIntervals?: boolean;
  hasPenaltyShootout?: boolean;
  penaltyBonusPointsEnabled?: boolean;
  matchPeriodLabel?: string | null;
  showTotalGameTime?: boolean;
  homeScore: number;
  awayScore: number;
  homePenaltyScore: number;
  awayPenaltyScore: number;
  homePenaltyAttempts?: unknown;
  awayPenaltyAttempts?: unknown;
  minute: number | null;
  elapsedSeconds: number;
  accumulatedPeriodSeconds: number;
  clockRunning: boolean;
  clockStartedAt: Date | null;
  periodLengthMin: number;
  periodCount: number;
  homeTeamId: string;
  awayTeamId: string;
  events?: MatchEventLike[];
  [key: string]: unknown;
};

export type MatchScoreAudit = {
  source: "database";
  homeScore: number;
  awayScore: number;
  homePenaltyScore: number;
  awayPenaltyScore: number;
  homePenaltyAttempts: string;
  awayPenaltyAttempts: string;
};

export async function syncMatchClockToNow(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return match;

  const phase = resolveCurrentPhase(match as MatchPhaseFields);
  if (match.isClockRunning && isTimedPhase(phase)) {
    const data = buildSyncPhaseClockData(match, new Date());
    if (data) {
      return prisma.match.update({
        where: { id: matchId },
        data: { ...data, clockRunning: true, clockStartedAt: data.phaseStartedAt },
      });
    }
  }

  if (!match.clockRunning && !match.isClockRunning) return match;

  const now = new Date();
  const elapsed = resolveElapsedSeconds(match, now);
  const minute = Math.max(1, Math.ceil(elapsed / 60) || match.minute || 1);

  return prisma.match.update({
    where: { id: matchId },
    data: {
      minute,
      elapsedSeconds: elapsed,
      clockStartedAt: now,
    },
  });
}

export async function repairLiveClockIfNeeded(
  match: MatchWithRelations & { events?: MatchEventLike[] }
) {
  const phase = resolveCurrentPhase(match as MatchPhaseFields);
  if (match.periodsConfigured || phase !== "PRE_MATCH") {
    if (!isTimedPhase(phase) || match.isClockRunning) return;
    return;
  }

  const events = match.events ?? [];
  const period = resolveMatchPeriodForDisplay(match, events);
  if (!shouldMatchClockBeRunning(match.status, period) || match.clockRunning) return;

  const now = new Date();
  await prisma.match.update({
    where: { id: match.id },
    data: {
      clockRunning: true,
      isClockRunning: true,
      clockStartedAt: now,
      phaseStartedAt: now,
    },
  });
}

/** Apenas após eventos do operador — não chamar em GET da partida. */
export async function reconcileAndPersistScores(
  matchId: string,
  homeTeamId: string,
  awayTeamId: string,
  events: MatchEventLike[]
) {
  const { Prisma } = await import("@prisma/client");
  const { rebuildScoresFromEvents } = await import("@/lib/match-live");
  const hasKickEvents = events.some(
    (e) => e.type === "PENALTY_GOAL" || e.type === "PENALTY_MISS"
  );
  const matchRow = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      homePenaltyScore: true,
      awayPenaltyScore: true,
      homePenaltyAttempts: true,
      awayPenaltyAttempts: true,
    },
  });
  const scores = rebuildScoresFromEvents(events, homeTeamId, awayTeamId, {
    storedHomePenaltyAttempts: matchRow?.homePenaltyAttempts,
    storedAwayPenaltyAttempts: matchRow?.awayPenaltyAttempts,
  });
  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore: scores.homeScore,
      awayScore: scores.awayScore,
      homePenaltyScore: hasKickEvents
        ? scores.homePenaltyScore
        : (matchRow?.homePenaltyScore ?? 0),
      awayPenaltyScore: hasKickEvents
        ? scores.awayPenaltyScore
        : (matchRow?.awayPenaltyScore ?? 0),
      homePenaltyAttempts: hasKickEvents
        ? scores.homePenaltyAttempts.length > 0
          ? scores.homePenaltyAttempts
          : Prisma.DbNull
        : Prisma.DbNull,
      awayPenaltyAttempts: hasKickEvents
        ? scores.awayPenaltyAttempts.length > 0
          ? scores.awayPenaltyAttempts
          : Prisma.DbNull
        : Prisma.DbNull,
    },
  });
  return scores;
}

export async function repairMatchPeriodIfNeeded(
  match: MatchWithRelations & { events?: MatchEventLike[] }
) {
  if (match.periodsConfigured) return;
  const events = match.events ?? [];
  const resolved = resolveMatchPeriodForDisplay(match, events);
  const stored = match.matchPeriod;
  if (
    resolved &&
    resolved !== stored &&
    resolved !== "SCHEDULED" &&
    stored !== "FINISHED"
  ) {
    await prisma.match.update({
      where: { id: match.id },
      data: { matchPeriod: resolved as MatchPeriod },
    });
  }
}

/**
 * Enriquece resposta da API sem recalcular placar.
 * Tempo normal e pênaltis vêm exclusivamente dos campos persistidos no banco.
 */
export function enrichMatchForApi<T extends MatchWithRelations>(
  match: T
): T & {
  inPenaltyShootout: boolean;
  penaltyKicks: { home: boolean[]; away: boolean[] };
  penaltyAttempts: { home: string[]; away: string[] };
  penaltyWinner: "home" | "away" | null;
  currentPhase: string;
  scoreAudit: MatchScoreAudit;
} {
  const events = (match.events ?? []) as MatchEventLike[];
  const phase = resolveCurrentPhase(match as MatchPhaseFields);
  const period =
    phase === "PERIOD_1"
      ? "FIRST_HALF"
      : phase === "INTERVAL_1" || phase === "INTERVAL_2"
        ? "HALFTIME"
        : phase === "PERIOD_2"
          ? "SECOND_HALF"
          : phase === "PERIOD_3"
            ? "THIRD_HALF"
            : phase === "PENALTIES"
              ? "PENALTY_SHOOTOUT"
              : phase === "FINISHED"
                ? "FINISHED"
                : resolveMatchPeriodForDisplay(match, events);

  const elapsed =
    match.periodsConfigured || phase !== "PRE_MATCH"
      ? resolvePhaseElapsed(match as MatchPhaseFields)
      : resolveElapsedSeconds(match);

  const scores = rebuildScoresFromEvents(
    events,
    match.homeTeamId,
    match.awayTeamId,
    {
      storedHomePenaltyAttempts: match.homePenaltyAttempts,
      storedAwayPenaltyAttempts: match.awayPenaltyAttempts,
    }
  );

  const hasKickEvents = events.some(
    (e) => e.type === "PENALTY_GOAL" || e.type === "PENALTY_MISS"
  );

  const homeScore = scores.homeScore;
  const awayScore = scores.awayScore;
  const homeAttempts = hasKickEvents ? scores.homePenaltyAttempts : [];
  const awayAttempts = hasKickEvents ? scores.awayPenaltyAttempts : [];
  const homePenaltyScore = hasKickEvents
    ? scores.homePenaltyScore
    : (match.homePenaltyScore ?? 0);
  const awayPenaltyScore = hasKickEvents
    ? scores.awayPenaltyScore
    : (match.awayPenaltyScore ?? 0);

  const running = match.isClockRunning ?? match.clockRunning;
  const hasPenaltyAttempts =
    homeAttempts.length > 0 || awayAttempts.length > 0;
  const hasPenaltyScores = homePenaltyScore > 0 || awayPenaltyScore > 0;
  const inPenaltyShootout =
    phase === "PENALTIES" ||
    match.hasPenaltyShootout === true ||
    hasPenaltyAttempts ||
    hasPenaltyScores;

  const shootoutResult = penaltyShootoutWinner(homePenaltyScore, awayPenaltyScore);
  const penaltyWinner =
    (hasPenaltyAttempts || hasPenaltyScores) && shootoutResult !== "draw"
      ? shootoutResult
      : null;

  const displayMinute = Math.max(
    1,
    Math.ceil(elapsed / 60) || (match.minute ?? 1)
  );

  const scoreAudit: MatchScoreAudit = {
    source: "database",
    homeScore,
    awayScore,
    homePenaltyScore,
    awayPenaltyScore,
    homePenaltyAttempts: homeAttempts.join(""),
    awayPenaltyAttempts: awayAttempts.join(""),
  };

  const enriched = enrichMatchPhaseFields({
    ...match,
    matchPeriod: period as MatchPeriod,
    currentPhase: phase,
    homeScore,
    awayScore,
    homePenaltyScore,
    awayPenaltyScore,
    homePenaltyAttempts: homeAttempts,
    awayPenaltyAttempts: awayAttempts,
    minute: running ? displayMinute : match.minute ?? displayMinute,
    elapsedSeconds: elapsed,
    phaseElapsedSeconds: match.phaseElapsedSeconds ?? elapsed,
    clockRunning: running,
    isClockRunning: running,
    clockStartedAt:
      match.clockStartedAt instanceof Date
        ? match.clockStartedAt.toISOString()
        : match.clockStartedAt,
    phaseStartedAt:
      match.phaseStartedAt instanceof Date
        ? match.phaseStartedAt.toISOString()
        : match.phaseStartedAt ?? null,
    penaltyKicks: {
      home: attemptsToBooleans(homeAttempts),
      away: attemptsToBooleans(awayAttempts),
    },
    penaltyAttempts: {
      home: homeAttempts,
      away: awayAttempts,
    },
    penaltyWinner,
    inPenaltyShootout,
    scoreAudit,
  });

  const periods = resolveTotalPeriods(match as MatchPhaseFields);
  const withPeriods = {
    ...enriched,
    totalPeriods: periods,
    periodCount: periods,
  };

  return withPeriods as T & {
    inPenaltyShootout: boolean;
    penaltyKicks: { home: boolean[]; away: boolean[] };
    penaltyAttempts: { home: string[]; away: string[] };
    penaltyWinner: "home" | "away" | null;
    currentPhase: string;
    scoreAudit: MatchScoreAudit;
  };
}
