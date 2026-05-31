import {
  buildPhaseClockDisplay,
  formatPhaseCountdown,
  formatPublicPhaseClock,
  resolveCurrentPhase,
  type MatchPhaseFields,
} from "@/lib/match-phase";
import {
  formatElapsedClock,
  resolveElapsedSeconds,
  resolveMatchPeriodForDisplay,
  type MatchClockFields,
  type MatchEventLike,
} from "@/lib/match-live";

export type MatchClockDisplayFields = MatchClockFields &
  Partial<MatchPhaseFields> & {
    status: string;
    accumulatedPeriodSeconds?: number;
  };

export type PublicMatchClockDisplay = {
  period: string;
  periodLabel: string;
  remainingSeconds: number;
  periodElapsedSeconds: number;
  totalGameSeconds: number | null;
  showCountdown: boolean;
  isPaused: boolean;
};

function hasPhaseFields(match: MatchClockDisplayFields): boolean {
  return (
    match.currentPhase != null &&
    (match.periodsConfigured ||
      resolveCurrentPhase(match as MatchPhaseFields) !== "PRE_MATCH" ||
      match.status === "LIVE" ||
      match.status === "HALFTIME")
  );
}

export function buildPublicMatchClockDisplay(
  match: MatchClockDisplayFields,
  events: MatchEventLike[] = [],
  now = new Date()
): PublicMatchClockDisplay {
  if (hasPhaseFields(match)) {
    const d = buildPhaseClockDisplay(match as MatchPhaseFields, now);
    return {
      period: d.phase,
      periodLabel: d.customLabel ?? d.phaseLabel,
      remainingSeconds: d.remainingSeconds,
      periodElapsedSeconds: d.elapsedSeconds,
      totalGameSeconds: d.totalGameSeconds,
      showCountdown: d.showCountdown,
      isPaused: d.isPaused,
    };
  }

  const period = resolveMatchPeriodForDisplay(match, events);
  const periodLabel =
    period === "HALFTIME"
      ? "Intervalo"
      : period === "PENALTY_SHOOTOUT"
        ? "Disputa de Pênaltis"
        : period === "FINISHED"
          ? "Encerrado"
          : period === "FIRST_HALF"
            ? "1º Tempo"
            : period === "SECOND_HALF"
              ? "2º Tempo"
              : period === "THIRD_HALF"
                ? "3º Tempo"
                : period;

  if (period === "HALFTIME" || match.status === "HALFTIME") {
    return {
      period,
      periodLabel: "Intervalo",
      remainingSeconds: 0,
      periodElapsedSeconds: match.elapsedSeconds ?? 0,
      totalGameSeconds: null,
      showCountdown: false,
      isPaused: true,
    };
  }

  if (period === "PENALTY_SHOOTOUT") {
    return {
      period,
      periodLabel: "Disputa de Pênaltis",
      remainingSeconds: 0,
      periodElapsedSeconds: 0,
      totalGameSeconds: null,
      showCountdown: false,
      isPaused: !match.clockRunning,
    };
  }

  if (period === "FINISHED") {
    return {
      period,
      periodLabel: "Encerrado",
      remainingSeconds: 0,
      periodElapsedSeconds: 0,
      totalGameSeconds: null,
      showCountdown: false,
      isPaused: true,
    };
  }

  const periodSec = (match.periodLengthMin ?? 17) * 60;
  const periodElapsed = Math.min(periodSec, resolveElapsedSeconds(match, now));
  const remainingSeconds = Math.max(0, periodSec - periodElapsed);
  const isActivePeriod =
    period === "FIRST_HALF" ||
    period === "SECOND_HALF" ||
    period === "THIRD_HALF";

  return {
    period,
    periodLabel,
    remainingSeconds,
    periodElapsedSeconds: periodElapsed,
    totalGameSeconds: null,
    showCountdown: isActivePeriod && match.status === "LIVE",
    isPaused: !match.clockRunning && match.status === "LIVE",
  };
}

export function formatLiveClockCompact(
  match: MatchClockDisplayFields,
  events: MatchEventLike[] = [],
  now = new Date()
): string {
  if (hasPhaseFields(match)) {
    const lines = formatPublicPhaseClock(match as MatchPhaseFields, now);
    if (lines.primary === lines.phaseLabel) return lines.primary;
    return `${lines.phaseLabel} · ${lines.primary}`;
  }
  const d = buildPublicMatchClockDisplay(match, events, now);
  if (!d.showCountdown) return d.periodLabel;
  return `${d.periodLabel} · ${formatElapsedClock(d.remainingSeconds)}`;
}

export function formatLiveClockLines(
  match: MatchClockDisplayFields,
  events: MatchEventLike[] = [],
  now = new Date()
): { primary: string; secondary: string | null; periodLabel: string } {
  if (hasPhaseFields(match)) {
    const lines = formatPublicPhaseClock(match as MatchPhaseFields, now);
    const built = buildPhaseClockDisplay(match as MatchPhaseFields, now);
    const secondary =
      built.totalGameSeconds != null
        ? `Tempo de jogo ${formatPhaseCountdown(built.totalGameSeconds)}`
        : lines.secondary;
    return {
      primary: lines.primary,
      secondary,
      periodLabel: lines.phaseLabel,
    };
  }
  const d = buildPublicMatchClockDisplay(match, events, now);
  if (!d.showCountdown) {
    return { primary: d.periodLabel, secondary: null, periodLabel: d.periodLabel };
  }
  return {
    primary: formatElapsedClock(d.remainingSeconds),
    secondary: null,
    periodLabel: d.periodLabel,
  };
}
