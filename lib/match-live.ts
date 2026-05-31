import type { MatchPeriod } from "@prisma/client";
import {
  rebuildPenaltyShootoutFromEvents,
  sortEventsForScoring,
} from "@/lib/match-penalties";

export type MatchClockFields = {
  status: string;
  matchPeriod: MatchPeriod | string;
  minute: number | null;
  /** Segundos decorridos no período em andamento. */
  elapsedSeconds: number;
  accumulatedPeriodSeconds?: number;
  clockRunning: boolean;
  clockStartedAt: Date | string | null;
  periodLengthMin: number;
  periodCount: number;
};

export type MatchScoreFields = {
  homeScore: number;
  awayScore: number;
  homePenaltyScore: number;
  awayPenaltyScore: number;
};

export type MatchEventLike = {
  type: string;
  minute?: number;
  teamId?: string | null;
  description?: string | null;
  createdAt?: Date | string;
};

export type PenaltyKickDisplay = boolean;

export type MatchLiveDisplay = {
  periodLabel: string;
  clockLabel: string | null;
  displayMinute: number | null;
  elapsedSeconds: number;
  inPenaltyShootout: boolean;
  homePenaltyKicks: PenaltyKickDisplay[];
  awayPenaltyKicks: PenaltyKickDisplay[];
};

const PERIOD_LABELS: Record<string, string> = {
  SCHEDULED: "Agendado",
  FIRST_HALF: "1º Tempo",
  HALFTIME: "Intervalo",
  SECOND_HALF: "2º Tempo",
  THIRD_HALF: "3º Tempo",
  PENALTY_SHOOTOUT: "Disputa de Pênaltis",
  FINISHED: "Encerrado",
};

export function formatElapsedClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getTotalMatchSeconds(periodLengthMin: number, periodCount: number): number {
  return periodLengthMin * periodCount * 60;
}

/** Segundos decorridos considerando relógio em andamento. */
export function resolveElapsedSeconds(match: MatchClockFields, now = new Date()): number {
  let total = match.elapsedSeconds ?? 0;
  if (match.clockRunning && match.clockStartedAt) {
    const started =
      match.clockStartedAt instanceof Date
        ? match.clockStartedAt.getTime()
        : new Date(match.clockStartedAt).getTime();
    if (!Number.isNaN(started)) {
      total += Math.max(0, Math.floor((now.getTime() - started) / 1000));
    }
  }
  return total;
}

export function pauseClockData(match: MatchClockFields, now = new Date()) {
  const periodElapsed = resolveElapsedSeconds(match, now);
  const accumulated = (match.accumulatedPeriodSeconds ?? 0) + periodElapsed;
  const totalMin = Math.max(1, Math.ceil(accumulated / 60));
  return {
    elapsedSeconds: periodElapsed,
    accumulatedPeriodSeconds: accumulated,
    clockRunning: false,
    clockStartedAt: null as Date | null,
    minute: totalMin,
  };
}

export function resumeClockData(match: MatchClockFields, now = new Date()) {
  return {
    clockRunning: true,
    clockStartedAt: now,
  };
}

/** Encerra período em andamento, soma ao acumulado e zera o cronômetro do período. */
export function startNewPeriodClock(
  match: MatchClockFields,
  now = new Date()
): {
  elapsedSeconds: number;
  accumulatedPeriodSeconds: number;
  clockRunning: boolean;
  clockStartedAt: Date;
} {
  const periodElapsed = resolveElapsedSeconds(match, now);
  const wasActivePeriod =
    match.matchPeriod === "FIRST_HALF" ||
    match.matchPeriod === "SECOND_HALF" ||
    match.matchPeriod === "THIRD_HALF";

  return {
    elapsedSeconds: 0,
    accumulatedPeriodSeconds:
      (match.accumulatedPeriodSeconds ?? 0) + (wasActivePeriod ? periodElapsed : 0),
    clockRunning: true,
    clockStartedAt: now,
  };
}

/** Retoma período já salvo no acumulado (ex.: após intervalo). */
export function resumeNewPeriodClock(
  match: MatchClockFields,
  now = new Date()
) {
  return {
    elapsedSeconds: 0,
    accumulatedPeriodSeconds: match.accumulatedPeriodSeconds ?? 0,
    clockRunning: true,
    clockStartedAt: now,
  };
}

export function inferPeriodFromEvents(events: MatchEventLike[]): MatchPeriod | null {
  let period: MatchPeriod | null = null;
  for (const e of events) {
    const d = (e.description ?? "").toLowerCase();
    if (e.type === "HALFTIME") period = "HALFTIME";
    if (e.type === "KICKOFF") {
      if (d.includes("pênalt") || d.includes("penalt")) period = "PENALTY_SHOOTOUT";
      else if (d.includes("terceiro")) period = "THIRD_HALF";
      else if (d.includes("segundo") || d.includes("2º") || d.includes("2o"))
        period = "SECOND_HALF";
      else if (d.includes("início") || d.includes("inicio") || d.includes("primeiro"))
        period = "FIRST_HALF";
      else if (!period) period = "FIRST_HALF";
    }
    if (e.type === "FULLTIME") period = "FINISHED";
  }
  return period;
}

const PERIOD_RANK: Record<string, number> = {
  SCHEDULED: 0,
  FIRST_HALF: 1,
  HALFTIME: 2,
  SECOND_HALF: 3,
  THIRD_HALF: 4,
  PENALTY_SHOOTOUT: 5,
  FINISHED: 6,
};

/** Período efetivo para exibição (DB + eventos quando o banco ficou desatualizado). */
export function resolveMatchPeriodForDisplay(
  match: MatchClockFields & { status: string },
  events: MatchEventLike[] = []
): MatchPeriod | string {
  const inferred = inferPeriodFromEvents(events);
  const stored = match.matchPeriod as string | undefined;

  if (match.status === "HALFTIME") return "HALFTIME";
  if (stored === "HALFTIME") return "HALFTIME";

  if (inferred && stored && stored !== "SCHEDULED") {
    const iRank = PERIOD_RANK[inferred] ?? 0;
    const sRank = PERIOD_RANK[stored] ?? 0;
    if (iRank > sRank) return inferred;
    return stored;
  }

  if (stored && stored !== "SCHEDULED") return stored;
  if (inferred) return inferred;
  if (match.status === "FINISHED") return "FINISHED";
  return stored ?? "FIRST_HALF";
}

/** Segundos decorridos no período atual. */
export function getPeriodElapsedSeconds(
  match: MatchClockFields,
  _period?: string,
  now = new Date()
): number {
  const periodSec = (match.periodLengthMin ?? 17) * 60;
  return Math.min(periodSec, resolveElapsedSeconds(match, now));
}

export function getPeriodRemainingSeconds(
  match: MatchClockFields,
  now = new Date()
): number {
  const periodSec = (match.periodLengthMin ?? 17) * 60;
  return Math.max(0, periodSec - getPeriodElapsedSeconds(match, undefined, now));
}

const ACTIVE_CLOCK_PERIODS = new Set(["FIRST_HALF", "SECOND_HALF", "THIRD_HALF"]);

export function shouldMatchClockBeRunning(
  status: string,
  matchPeriod: string | null | undefined
): boolean {
  return status === "LIVE" && !!matchPeriod && ACTIVE_CLOCK_PERIODS.has(matchPeriod);
}

function isPenaltyShootoutKickoff(e: MatchEventLike): boolean {
  const desc = (e.description ?? "").toLowerCase();
  return (
    e.type === "KICKOFF" &&
    (desc.includes("pênalt") || desc.includes("penalt") || desc.includes("disputa"))
  );
}

function indexOfFirstPenaltyShootoutEvent(events: MatchEventLike[]): number {
  return events.findIndex(
    (e) =>
      e.type === "PENALTY_GOAL" ||
      e.type === "PENALTY_MISS" ||
      isPenaltyShootoutKickoff(e)
  );
}

export function rebuildScoresFromEvents(
  events: MatchEventLike[],
  homeTeamId: string,
  awayTeamId: string
) {
  const sorted = sortEventsForScoring(events);
  const penalties = rebuildPenaltyShootoutFromEvents(sorted, homeTeamId, awayTeamId);
  const firstPenaltyIdx = indexOfFirstPenaltyShootoutEvent(sorted);

  let homeScore = 0;
  let awayScore = 0;

  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    const inPenaltyShootout = firstPenaltyIdx >= 0 && i >= firstPenaltyIdx;
    if (isPenaltyShootoutKickoff(e)) continue;

    const isHome = e.teamId === homeTeamId;
    const isAway = e.teamId === awayTeamId;

    if (e.type === "GOAL" && !inPenaltyShootout) {
      if (isHome) homeScore += 1;
      if (isAway) awayScore += 1;
    }
  }

  return {
    homeScore,
    awayScore,
    homePenaltyScore: penalties.homeScore,
    awayPenaltyScore: penalties.awayScore,
    homePenaltyAttempts: penalties.homeAttempts,
    awayPenaltyAttempts: penalties.awayAttempts,
    homePenaltyKicks: penalties.homePenaltyKicks,
    awayPenaltyKicks: penalties.awayPenaltyKicks,
    inPenaltyShootout: penalties.inPenaltyShootout,
  };
}

export function buildMatchLiveDisplay(
  match: MatchClockFields & MatchScoreFields,
  events: MatchEventLike[] = [],
  homeTeamId?: string,
  awayTeamId?: string
): MatchLiveDisplay {
  const period = (match.matchPeriod as string) || inferPeriodFromEvents(events) || "SCHEDULED";
  const elapsed = resolveElapsedSeconds(match);
  const periodLabel = PERIOD_LABELS[period] ?? period;
  const inPenaltyShootout = period === "PENALTY_SHOOTOUT";

  let clockLabel: string | null = null;
  if (period === "HALFTIME" || match.status === "HALFTIME") {
    clockLabel = "Intervalo";
  } else if (inPenaltyShootout) {
    clockLabel = "Disputa de Pênaltis";
  } else if (match.status === "LIVE" || match.clockRunning) {
    clockLabel = `${periodLabel} · ${formatElapsedClock(elapsed)}`;
  }

  const scoreRebuild =
    homeTeamId && awayTeamId
      ? rebuildScoresFromEvents(events, homeTeamId, awayTeamId)
      : {
          homePenaltyKicks: [] as PenaltyKickDisplay[],
          awayPenaltyKicks: [] as PenaltyKickDisplay[],
        };

  return {
    periodLabel,
    clockLabel,
    displayMinute: Math.max(1, Math.ceil(elapsed / 60) || (match.minute ?? 1)),
    elapsedSeconds: elapsed,
    inPenaltyShootout,
    homePenaltyKicks: scoreRebuild.homePenaltyKicks,
    awayPenaltyKicks: scoreRebuild.awayPenaltyKicks,
  };
}

export function formatPublicLiveClock(
  match: MatchClockFields,
  events: MatchEventLike[] = [],
  now = new Date()
): string {
  const period = resolveMatchPeriodForDisplay(match, events);
  const label = PERIOD_LABELS[period] ?? period;
  if (period === "HALFTIME" || match.status === "HALFTIME") return "Intervalo";
  if (period === "PENALTY_SHOOTOUT") return "Disputa de Pênaltis";
  if (
    period === "FIRST_HALF" ||
    period === "SECOND_HALF" ||
    period === "THIRD_HALF"
  ) {
    const remaining = getPeriodRemainingSeconds(match, now);
    return `${label} · ${formatElapsedClock(remaining)}`;
  }
  return label;
}
