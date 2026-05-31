import type { MatchGamePhase } from "@prisma/client";
import { resolveCurrentPhase, type MatchPhaseFields } from "@/lib/match-phase";

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
