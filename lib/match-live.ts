import type { MatchPeriod } from "@prisma/client";

export type MatchClockFields = {
  status: string;
  matchPeriod: MatchPeriod | string;
  minute: number | null;
  elapsedSeconds: number;
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
    total += Math.max(0, Math.floor((now.getTime() - started) / 1000));
  }
  const maxSec = getTotalMatchSeconds(match.periodLengthMin ?? 17, match.periodCount ?? 3);
  return Math.min(total, maxSec);
}

export function pauseClockData(match: MatchClockFields, now = new Date()) {
  const elapsed = resolveElapsedSeconds(match, now);
  return {
    elapsedSeconds: elapsed,
    clockRunning: false,
    clockStartedAt: null as Date | null,
    minute: Math.max(1, Math.min(match.periodLengthMin * match.periodCount, Math.ceil(elapsed / 60) || 1)),
  };
}

export function resumeClockData(match: MatchClockFields, now = new Date()) {
  return {
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

/** Segundos decorridos só no período atual (ex.: 2º tempo começa em 00:00). */
export function getPeriodElapsedSeconds(
  match: MatchClockFields,
  period: string
): number {
  const total = resolveElapsedSeconds(match);
  const periodSec = (match.periodLengthMin ?? 17) * 60;
  if (period === "SECOND_HALF") return Math.max(0, total - periodSec);
  if (period === "THIRD_HALF") return Math.max(0, total - periodSec * 2);
  return total;
}

export function rebuildScoresFromEvents(
  events: MatchEventLike[],
  homeTeamId: string,
  awayTeamId: string
) {
  let penaltyPhase = false;
  let homeScore = 0;
  let awayScore = 0;
  let homePenaltyScore = 0;
  let awayPenaltyScore = 0;
  const homePenaltyKicks: PenaltyKickDisplay[] = [];
  const awayPenaltyKicks: PenaltyKickDisplay[] = [];

  for (const e of events) {
    const desc = (e.description ?? "").toLowerCase();
    if (e.type === "KICKOFF" && (desc.includes("pênalt") || desc.includes("penalt"))) {
      penaltyPhase = true;
      continue;
    }

    const isHome = e.teamId === homeTeamId;
    const isAway = e.teamId === awayTeamId;

    if (e.type === "GOAL" && !penaltyPhase) {
      if (isHome) homeScore += 1;
      if (isAway) awayScore += 1;
    }
    if (e.type === "PENALTY_GOAL") {
      if (isHome) {
        homePenaltyScore += 1;
        homePenaltyKicks.push(true);
      }
      if (isAway) {
        awayPenaltyScore += 1;
        awayPenaltyKicks.push(true);
      }
    }
    if (e.type === "PENALTY_MISS") {
      if (isHome) homePenaltyKicks.push(false);
      if (isAway) awayPenaltyKicks.push(false);
    }
  }

  return {
    homeScore,
    awayScore,
    homePenaltyScore,
    awayPenaltyScore,
    homePenaltyKicks,
    awayPenaltyKicks,
    inPenaltyShootout: penaltyPhase || homePenaltyScore + awayPenaltyScore > 0,
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
  match: MatchClockFields & { homePenaltyScore?: number; awayPenaltyScore?: number },
  events: MatchEventLike[] = []
): string {
  const period = (match.matchPeriod as string) || inferPeriodFromEvents(events) || match.status;
  if (period === "HALFTIME" || match.status === "HALFTIME") return "Intervalo";
  if (period === "PENALTY_SHOOTOUT") return "Disputa de Pênaltis";
  if (period === "FIRST_HALF") {
    const elapsed = resolveElapsedSeconds(match);
    return `1º Tempo · ${formatElapsedClock(elapsed)}`;
  }
  if (period === "SECOND_HALF") {
    const elapsed = resolveElapsedSeconds(match);
    return `2º Tempo · ${formatElapsedClock(elapsed)}`;
  }
  if (period === "THIRD_HALF") {
    const elapsed = resolveElapsedSeconds(match);
    return `3º Tempo · ${formatElapsedClock(elapsed)}`;
  }
  if (match.status === "LIVE" && match.minute != null) {
    return `Ao vivo · ${match.minute}'`;
  }
  return "Ao vivo";
}
