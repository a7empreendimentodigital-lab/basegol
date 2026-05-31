import type { Match, MatchGamePhase, Prisma } from "@prisma/client";
import {
  getMatchConfig,
  getPrismaStatusForPhase,
  isTimedPhase,
  mapPhaseToLegacyPeriod,
  pausePhaseClock,
  phaseIndex,
  resolveCurrentPhase,
  resolvePhaseElapsed,
  resolveTotalPeriods,
  startPhaseClock,
  type MatchPhaseFields,
} from "@/lib/match-phase";

export type GoToPhaseInput = {
  targetPhase: MatchGamePhase;
  startClock?: boolean;
  phaseDurationSeconds?: number;
};

export type SetMatchConfigInput = {
  totalPeriods?: number;
  hasIntervals?: boolean;
  hasPenaltyShootout?: boolean;
  penaltyBonusPointsEnabled?: boolean;
  phaseDurationSeconds?: number;
  periodLengthMin?: number;
  showTotalGameTime?: boolean;
};

export function buildPhaseUpdateData(
  match: Match,
  input: GoToPhaseInput,
  now = new Date()
): Prisma.MatchUpdateInput {
  const target = input.targetPhase;
  const config = getMatchConfig(match as MatchPhaseFields);
  const duration =
    input.phaseDurationSeconds ??
    match.phaseDurationSeconds ??
    (match.periodLengthMin ?? 17) * 60;

  const fields = match as MatchPhaseFields;
  let phaseElapsed = match.phaseElapsedSeconds;
  let isClockRunning = false;
  let phaseStartedAt: Date | null = null;

  if (isTimedPhase(resolveCurrentPhase(fields)) && match.isClockRunning) {
    const paused = pausePhaseClock(fields, now);
    phaseElapsed = paused.phaseElapsedSeconds;
  }

  const resetElapsed = isTimedPhase(target);
  if (resetElapsed && input.startClock) {
    const started = startPhaseClock(
      { ...fields, phaseElapsedSeconds: 0 },
      now,
      true
    );
    phaseElapsed = 0;
    isClockRunning = true;
    phaseStartedAt = started.phaseStartedAt as Date;
  } else if (resetElapsed && !input.startClock) {
    phaseElapsed = 0;
    isClockRunning = false;
    phaseStartedAt = null;
  } else if (input.startClock && isTimedPhase(target)) {
    const started = startPhaseClock(
      { ...fields, phaseElapsedSeconds: 0 },
      now,
      true
    );
    phaseElapsed = 0;
    isClockRunning = true;
    phaseStartedAt = started.phaseStartedAt as Date;
  } else {
    phaseElapsed = 0;
    isClockRunning = false;
    phaseStartedAt = null;
  }

  const status = getPrismaStatusForPhase(target);
  const legacyPeriod = mapPhaseToLegacyPeriod(target);

  return {
    currentPhase: target,
    currentPhaseIndex: phaseIndex(target),
    phaseDurationSeconds: duration,
    phaseElapsedSeconds: phaseElapsed,
    phaseStartedAt,
    isClockRunning,
    clockRunning: isClockRunning,
    clockStartedAt: phaseStartedAt,
    elapsedSeconds: phaseElapsed,
    status: status as Match["status"],
    matchPeriod: legacyPeriod as Match["matchPeriod"],
    periodsConfigured: match.periodsConfigured || target !== "PRE_MATCH",
    totalPeriods: config.totalPeriods,
    hasIntervals: config.hasIntervals,
    hasPenaltyShootout: config.hasPenaltyShootout,
    penaltyBonusPointsEnabled: config.penaltyBonusPointsEnabled,
    periodLengthMin: Math.ceil(duration / 60),
    periodCount: config.totalPeriods,
    minute: isTimedPhase(target)
      ? Math.max(1, Math.ceil(phaseElapsed / 60) || 1)
      : match.minute,
  };
}

export function buildConfigUpdateData(
  match: Match,
  input: SetMatchConfigInput
): Prisma.MatchUpdateInput {
  const totalPeriods =
    input.totalPeriods != null
      ? Math.min(3, Math.max(2, input.totalPeriods))
      : resolveTotalPeriods(match as MatchPhaseFields);
  const duration =
    input.phaseDurationSeconds ??
    (input.periodLengthMin != null
      ? input.periodLengthMin * 60
      : match.phaseDurationSeconds);

  return {
    periodsConfigured: true,
    totalPeriods,
    periodCount: totalPeriods,
    hasIntervals: input.hasIntervals ?? match.hasIntervals,
    hasPenaltyShootout: input.hasPenaltyShootout ?? match.hasPenaltyShootout,
    penaltyBonusPointsEnabled:
      input.penaltyBonusPointsEnabled ?? match.penaltyBonusPointsEnabled,
    phaseDurationSeconds: duration,
    periodLengthMin:
      input.periodLengthMin ?? Math.max(1, Math.ceil(duration / 60)),
    showTotalGameTime: input.showTotalGameTime ?? match.showTotalGameTime,
  };
}

export function buildPauseClockData(match: Match, now = new Date()) {
  const paused = pausePhaseClock(match as MatchPhaseFields, now);
  return {
    ...paused,
    clockRunning: false,
    clockStartedAt: null as Date | null,
    elapsedSeconds: paused.phaseElapsedSeconds,
    minute: Math.max(1, Math.ceil(paused.phaseElapsedSeconds / 60) || 1),
  };
}

export function buildResumeClockData(match: Match, now = new Date()) {
  const started = startPhaseClock(match as MatchPhaseFields, now, false);
  return {
    ...started,
    clockRunning: true,
    clockStartedAt: started.phaseStartedAt as Date,
    elapsedSeconds: match.phaseElapsedSeconds,
  };
}

/** Persiste elapsed da fase atual quando o relógio está rodando. */
export function buildSyncPhaseClockData(match: Match, now = new Date()) {
  if (!match.isClockRunning || !isTimedPhase(resolveCurrentPhase(match))) {
    return null;
  }
  const elapsed = resolvePhaseElapsed(match as MatchPhaseFields, now);
  return {
    phaseElapsedSeconds: elapsed,
    phaseStartedAt: now,
    elapsedSeconds: elapsed,
    minute: Math.max(1, Math.ceil(elapsed / 60) || 1),
  };
}

export function enrichMatchPhaseFields<T extends MatchPhaseFields>(match: T) {
  const phase = resolveCurrentPhase(match);
  return {
    ...match,
    currentPhase: phase,
    inPenaltyShootout: phase === "PENALTIES",
    clockRunning: match.isClockRunning ?? (match as { clockRunning?: boolean }).clockRunning,
  };
}
