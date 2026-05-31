import type { MatchGamePhase } from "@prisma/client";
import {
  getPhaseLabel,
  isTimedPhase,
  resolveCurrentPhase,
  resolvePhaseElapsed,
  type MatchPhaseFields,
} from "@/lib/match-phase";
import { resolveElapsedSeconds, type MatchClockFields } from "@/lib/match-live";

/** Minuto gravado em eventos de mudança de fase (não usa o campo Minuto do operador). */
export function minuteForPhaseTransition(target: MatchGamePhase): number {
  switch (target) {
    case "PERIOD_1":
    case "PERIOD_2":
    case "PERIOD_3":
      return 1;
    case "INTERVAL_1":
    case "INTERVAL_2":
    case "PENALTIES":
    case "FINISHED":
    case "PRE_MATCH":
    default:
      return 0;
  }
}

/** Próximo número da cobrança na disputa (1, 2, 3…). */
export function nextPenaltyKickMinute(existingPenaltyEvents: number): number {
  return existingPenaltyEvents + 1;
}

export function shouldUsePenaltyKickMinute(match: MatchPhaseFields): boolean {
  return resolveCurrentPhase(match) === "PENALTIES";
}

export type OperatorMinuteFields = {
  status: string;
  minute?: number | null;
  isClockRunning?: boolean;
  clockRunning?: boolean;
  elapsedSeconds?: number;
  currentPhase?: string | null;
  matchPeriod?: string | null;
  periodLengthMin?: number;
  periodCount?: number;
  periodsConfigured?: boolean;
  phaseDurationSeconds?: number;
  phaseElapsedSeconds?: number;
  phaseStartedAt?: Date | string | null;
  clockStartedAt?: Date | string | null;
};

/** Minuto sugerido para o próximo evento (cronômetro do tempo em andamento). */
export function resolveOperatorEventMinute(
  match: OperatorMinuteFields,
  now = new Date()
): number {
  const phaseFields = match as MatchPhaseFields;
  const phase = resolveCurrentPhase(phaseFields);
  const periodLen = match.periodLengthMin ?? 17;

  if (phase === "PENALTIES") {
    return match.minute ?? 0;
  }

  if (isTimedPhase(phase)) {
    const elapsed = resolvePhaseElapsed(phaseFields, now);
    return Math.max(1, Math.min(periodLen, Math.ceil(elapsed / 60) || 1));
  }

  if (match.status === "LIVE" && (match.isClockRunning || match.clockRunning)) {
    const elapsed = resolveElapsedSeconds(
      {
        status: match.status,
        matchPeriod: (match.matchPeriod as string) ?? "FIRST_HALF",
        minute: match.minute ?? null,
        elapsedSeconds: match.elapsedSeconds ?? 0,
        clockRunning: true,
        clockStartedAt: match.clockStartedAt ?? null,
        periodLengthMin: periodLen,
        periodCount: match.periodCount ?? 2,
      },
      now
    );
    return Math.max(1, Math.min(periodLen, Math.ceil(elapsed / 60) || 1));
  }

  if (match.minute != null && match.minute > 0) {
    return match.minute;
  }

  return 0;
}

export function formatOperatorEventMinutePreview(
  minute: number,
  extraMinute: number,
  phaseLabel?: string | null
): string {
  const time =
    minute > 0
      ? extraMinute > 0
        ? `${minute}+${extraMinute}'`
        : `${minute}'`
      : "—";
  if (phaseLabel?.trim()) return `${time} · ${phaseLabel.trim()}`;
  return time;
}

export function operatorPhaseLabelForMinute(match: OperatorMinuteFields): string {
  return getPhaseLabel(match as MatchPhaseFields);
}
