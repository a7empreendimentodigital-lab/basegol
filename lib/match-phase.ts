import type { MatchGamePhase } from "@prisma/client";

export type { MatchGamePhase };

export const PHASE_LABELS: Record<MatchGamePhase, string> = {
  PRE_MATCH: "Pré-jogo",
  PERIOD_1: "1º Tempo",
  INTERVAL_1: "Intervalo",
  PERIOD_2: "2º Tempo",
  INTERVAL_2: "Intervalo",
  PERIOD_3: "3º Tempo",
  PENALTIES: "Disputa de Pênaltis",
  FINISHED: "Encerrada",
};

const TIMED_PHASES = new Set<MatchGamePhase>([
  "PERIOD_1",
  "PERIOD_2",
  "PERIOD_3",
]);

export type MatchPhaseFields = {
  status: string;
  currentPhase: MatchGamePhase | string;
  currentPhaseIndex?: number;
  phaseDurationSeconds?: number;
  phaseElapsedSeconds?: number;
  phaseStartedAt: Date | string | null;
  isClockRunning?: boolean;
  periodsConfigured?: boolean;
  totalPeriods?: number;
  hasIntervals?: boolean;
  hasPenaltyShootout?: boolean;
  penaltyBonusPointsEnabled?: boolean;
  matchPeriodLabel?: string | null;
  showTotalGameTime?: boolean;
  /** Legado — só leitura para migração */
  matchPeriod?: string | null;
  periodLengthMin?: number;
  periodCount?: number;
};

export type MatchPhaseConfig = {
  totalPeriods: number;
  hasIntervals: boolean;
  hasPenaltyShootout: boolean;
  penaltyBonusPointsEnabled: boolean;
  phaseDurationSeconds: number;
};

/** Fonte única para quantidade de tempos (evita dessync totalPeriods vs periodCount). */
export function resolveTotalPeriods(
  match: Pick<MatchPhaseFields, "totalPeriods" | "periodCount" | "periodsConfigured">
): number {
  if (match.periodsConfigured && match.totalPeriods != null) {
    return Math.min(3, Math.max(2, match.totalPeriods));
  }
  if (match.totalPeriods != null) {
    return Math.min(3, Math.max(2, match.totalPeriods));
  }
  if (match.periodCount != null) {
    return Math.min(3, Math.max(2, match.periodCount));
  }
  return 2;
}

export type PhaseClockDisplay = {
  phase: MatchGamePhase;
  phaseLabel: string;
  customLabel: string | null;
  showCountdown: boolean;
  remainingSeconds: number;
  elapsedSeconds: number;
  isPaused: boolean;
  isLive: boolean;
  /** Opcional — não exibir como principal */
  totalGameSeconds: number | null;
};

export type OperatorPhaseAction = {
  action: string;
  label: string;
  description?: string;
  variant?: "default" | "outline" | "destructive";
  payload?: Record<string, unknown>;
};

/** Migra partidas antigas sem currentPhase preenchido. */
export function resolveCurrentPhase(match: MatchPhaseFields): MatchGamePhase {
  const stored = match.currentPhase as MatchGamePhase;
  if (stored && stored !== "PRE_MATCH") return stored;

  const legacy = match.matchPeriod;
  if (legacy === "FIRST_HALF") return "PERIOD_1";
  if (legacy === "HALFTIME") return "INTERVAL_1";
  if (legacy === "SECOND_HALF") return "PERIOD_2";
  if (legacy === "THIRD_HALF") return "PERIOD_3";
  if (legacy === "PENALTY_SHOOTOUT") return "PENALTIES";
  if (legacy === "FINISHED" || match.status === "FINISHED") return "FINISHED";
  if (match.status === "LIVE") return "PERIOD_1";
  return "PRE_MATCH";
}

export function isTimedPhase(phase: MatchGamePhase): boolean {
  return TIMED_PHASES.has(phase);
}

export function resolvePhaseElapsed(
  match: MatchPhaseFields,
  now = new Date()
): number {
  let sec = match.phaseElapsedSeconds ?? 0;
  if (match.isClockRunning && match.phaseStartedAt) {
    const started =
      match.phaseStartedAt instanceof Date
        ? match.phaseStartedAt.getTime()
        : new Date(match.phaseStartedAt).getTime();
    if (!Number.isNaN(started)) {
      sec += Math.max(0, Math.floor((now.getTime() - started) / 1000));
    }
  }
  const max = match.phaseDurationSeconds ?? (match.periodLengthMin ?? 17) * 60;
  return Math.min(sec, max);
}

export function getPhaseLabel(match: MatchPhaseFields): string {
  if (match.matchPeriodLabel?.trim()) return match.matchPeriodLabel.trim();
  const phase = resolveCurrentPhase(match);
  return PHASE_LABELS[phase] ?? phase;
}

export function buildPhaseClockDisplay(
  match: MatchPhaseFields,
  now = new Date()
): PhaseClockDisplay {
  const phase = resolveCurrentPhase(match);
  const phaseLabel = PHASE_LABELS[phase] ?? phase;
  const customLabel = match.matchPeriodLabel?.trim() || null;
  const duration = match.phaseDurationSeconds ?? (match.periodLengthMin ?? 17) * 60;
  const elapsed = isTimedPhase(phase) ? resolvePhaseElapsed(match, now) : 0;
  const remaining = Math.max(0, duration - elapsed);
  const showCountdown = isTimedPhase(phase) && match.status === "LIVE";
  const isPaused = showCountdown && !match.isClockRunning;

  return {
    phase,
    phaseLabel,
    customLabel,
    showCountdown,
    remainingSeconds: remaining,
    elapsedSeconds: elapsed,
    isPaused,
    isLive: match.status === "LIVE" || match.status === "HALFTIME",
    totalGameSeconds: match.showTotalGameTime ? elapsed : null,
  };
}

export function formatPhaseCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatPublicPhaseClock(
  match: MatchPhaseFields,
  now = new Date()
): { primary: string; secondary: string | null; phaseLabel: string } {
  const d = buildPhaseClockDisplay(match, now);
  const label = d.customLabel ?? d.phaseLabel;

  if (d.phase === "FINISHED") {
    return { primary: "Encerrada", secondary: null, phaseLabel: label };
  }
  if (d.phase === "PENALTIES") {
    return { primary: "Disputa de Pênaltis", secondary: null, phaseLabel: label };
  }
  if (d.phase === "INTERVAL_1" || d.phase === "INTERVAL_2") {
    return { primary: "Intervalo", secondary: null, phaseLabel: label };
  }
  if (d.phase === "PRE_MATCH") {
    return { primary: "Pré-jogo", secondary: null, phaseLabel: label };
  }
  if (d.showCountdown) {
    return {
      primary: formatPhaseCountdown(d.remainingSeconds),
      secondary: d.isPaused ? "Cronômetro pausado" : null,
      phaseLabel: label,
    };
  }
  return { primary: label, secondary: null, phaseLabel: label };
}

export function getMatchConfig(match: MatchPhaseFields): MatchPhaseConfig {
  return {
    totalPeriods: resolveTotalPeriods(match),
    hasIntervals: match.hasIntervals ?? true,
    hasPenaltyShootout: match.hasPenaltyShootout ?? false,
    penaltyBonusPointsEnabled: match.penaltyBonusPointsEnabled ?? false,
    phaseDurationSeconds:
      match.phaseDurationSeconds ?? (match.periodLengthMin ?? 17) * 60,
  };
}

/** Próxima fase após encerrar um tempo (cronômetro para). */
export function getPhaseAfterPeriodEnd(
  current: MatchGamePhase,
  config: MatchPhaseConfig
): MatchGamePhase {
  if (current === "PERIOD_1") {
    if (config.hasIntervals) return "INTERVAL_1";
    if (config.totalPeriods >= 2) return "PERIOD_2";
    if (config.hasPenaltyShootout) return "PENALTIES";
    return "FINISHED";
  }
  if (current === "PERIOD_2") {
    if (config.totalPeriods >= 3) {
      return config.hasIntervals ? "INTERVAL_2" : "PERIOD_3";
    }
    if (config.hasPenaltyShootout) return "PENALTIES";
    return "FINISHED";
  }
  if (current === "PERIOD_3") {
    if (config.hasPenaltyShootout) return "PENALTIES";
    return "FINISHED";
  }
  return "FINISHED";
}

export function getPrismaStatusForPhase(phase: MatchGamePhase): string {
  if (phase === "FINISHED") return "FINISHED";
  if (phase === "PRE_MATCH") return "SCHEDULED";
  if (phase.startsWith("INTERVAL")) return "HALFTIME";
  return "LIVE";
}

export function mapPhaseToLegacyPeriod(phase: MatchGamePhase): string {
  if (phase === "PERIOD_1") return "FIRST_HALF";
  if (phase === "INTERVAL_1" || phase === "INTERVAL_2") return "HALFTIME";
  if (phase === "PERIOD_2") return "SECOND_HALF";
  if (phase === "PERIOD_3") return "THIRD_HALF";
  if (phase === "PENALTIES") return "PENALTY_SHOOTOUT";
  return "FINISHED";
}

export function pausePhaseClock(match: MatchPhaseFields, now = new Date()) {
  const elapsed = resolvePhaseElapsed(match, now);
  return {
    phaseElapsedSeconds: elapsed,
    isClockRunning: false,
    phaseStartedAt: null as Date | null,
    minute: Math.max(1, Math.ceil(elapsed / 60) || 1),
  };
}

export function startPhaseClock(
  match: MatchPhaseFields,
  now = new Date(),
  resetElapsed = false
) {
  return {
    phaseElapsedSeconds: resetElapsed ? 0 : match.phaseElapsedSeconds ?? 0,
    isClockRunning: true,
    phaseStartedAt: now,
  };
}

export function getOperatorPhaseActions(match: MatchPhaseFields): OperatorPhaseAction[] {
  const phase = resolveCurrentPhase(match);
  const config = getMatchConfig(match);
  const durationSec = config.phaseDurationSeconds;
  const actions: OperatorPhaseAction[] = [];

  if (phase === "PRE_MATCH" || !match.periodsConfigured) {
    actions.push({
      action: "SET_MATCH_CONFIG",
      label: "Salvar configuração",
      variant: "outline",
      payload: {},
    });
  }

  if (phase === "PRE_MATCH") {
    actions.push({
      action: "GO_TO_PHASE",
      label: "Iniciar 1º tempo",
      variant: "default",
      payload: {
        targetPhase: "PERIOD_1",
        startClock: true,
        phaseDurationSeconds: durationSec,
      },
    });
    return actions;
  }

  if (phase === "FINISHED") return actions;

  if (isTimedPhase(phase) && match.status === "LIVE") {
    if (match.isClockRunning) {
      actions.push({
        action: "PAUSE_CLOCK",
        label: "Pausar cronômetro",
        variant: "outline",
      });
    } else {
      actions.push({
        action: "RESUME_CLOCK",
        label: "Retomar cronômetro",
        variant: "outline",
      });
    }
    const next = getPhaseAfterPeriodEnd(phase, config);
    const endLabel =
      phase === "PERIOD_1"
        ? "Finalizar 1º tempo"
        : phase === "PERIOD_2"
          ? "Finalizar 2º tempo"
          : "Finalizar 3º tempo";
    actions.push({
      action: "GO_TO_PHASE",
      label: endLabel,
      variant: "default",
      payload: { targetPhase: next, startClock: false },
    });
  }

  if (phase === "INTERVAL_1") {
    actions.push({
      action: "GO_TO_PHASE",
      label: "Iniciar 2º tempo",
      variant: "default",
      payload: {
        targetPhase: "PERIOD_2",
        startClock: true,
        phaseDurationSeconds: durationSec,
      },
    });
  }

  if (phase === "INTERVAL_2" && config.totalPeriods >= 3) {
    actions.push({
      action: "GO_TO_PHASE",
      label: "Iniciar 3º tempo",
      variant: "default",
      payload: {
        targetPhase: "PERIOD_3",
        startClock: true,
        phaseDurationSeconds: durationSec,
      },
    });
  }

  const canStartPenalties =
    config.hasPenaltyShootout && phase !== "PENALTIES" && !isTimedPhase(phase);

  if (canStartPenalties) {
    actions.push({
      action: "GO_TO_PHASE",
      label: "Iniciar disputa de pênaltis",
      variant: "default",
      payload: { targetPhase: "PENALTIES", startClock: false },
    });
  }

  if (phase === "PENALTIES") {
    actions.push({
      action: "END_MATCH",
      label: "Encerrar partida",
      variant: "destructive",
      payload: { targetPhase: "FINISHED" },
    });
  } else {
    actions.push({
      action: "END_MATCH",
      label: "Encerrar partida",
      variant: "destructive",
      payload: { targetPhase: "FINISHED" },
    });
  }

  return actions;
}

/** Índice da fase para ordenação. */
export function phaseIndex(phase: MatchGamePhase): number {
  const order: MatchGamePhase[] = [
    "PRE_MATCH",
    "PERIOD_1",
    "INTERVAL_1",
    "PERIOD_2",
    "INTERVAL_2",
    "PERIOD_3",
    "PENALTIES",
    "FINISHED",
  ];
  return order.indexOf(phase);
}
