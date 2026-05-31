import {
  formatElapsedClock,
  resolveElapsedSeconds,
  resolveMatchPeriodForDisplay,
  type MatchClockFields,
  type MatchEventLike,
} from "@/lib/match-live";

const PERIOD_LABELS: Record<string, string> = {
  SCHEDULED: "Agendado",
  FIRST_HALF: "1º Tempo",
  HALFTIME: "Intervalo",
  SECOND_HALF: "2º Tempo",
  THIRD_HALF: "3º Tempo",
  PENALTY_SHOOTOUT: "Disputa de Pênaltis",
  FINISHED: "Encerrado",
};

export type MatchClockDisplayFields = MatchClockFields & {
  status: string;
  accumulatedPeriodSeconds?: number;
};

export type PublicMatchClockDisplay = {
  period: string;
  periodLabel: string;
  /** Segundos restantes no período (cronômetro regressivo). */
  remainingSeconds: number;
  /** Segundos decorridos no período atual. */
  periodElapsedSeconds: number;
  /** Soma dos períodos já encerrados + período atual. */
  totalGameSeconds: number;
  showCountdown: boolean;
  isPaused: boolean;
};

export function buildPublicMatchClockDisplay(
  match: MatchClockDisplayFields,
  events: MatchEventLike[] = [],
  now = new Date()
): PublicMatchClockDisplay {
  const period = resolveMatchPeriodForDisplay(match, events);
  const periodLabel = PERIOD_LABELS[period] ?? period;
  const periodSec = (match.periodLengthMin ?? 17) * 60;
  const accumulated = match.accumulatedPeriodSeconds ?? 0;

  if (period === "HALFTIME" || match.status === "HALFTIME") {
    return {
      period,
      periodLabel: "Intervalo",
      remainingSeconds: 0,
      periodElapsedSeconds: match.elapsedSeconds ?? 0,
      totalGameSeconds: accumulated + (match.elapsedSeconds ?? 0),
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
      totalGameSeconds: accumulated,
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
      totalGameSeconds: accumulated,
      showCountdown: false,
      isPaused: true,
    };
  }

  const periodElapsed = Math.min(
    periodSec,
    resolveElapsedSeconds(match, now)
  );
  const remainingSeconds = Math.max(0, periodSec - periodElapsed);
  const totalGameSeconds = accumulated + periodElapsed;
  const isActivePeriod =
    period === "FIRST_HALF" ||
    period === "SECOND_HALF" ||
    period === "THIRD_HALF";

  return {
    period,
    periodLabel,
    remainingSeconds,
    periodElapsedSeconds: periodElapsed,
    totalGameSeconds,
    showCountdown: isActivePeriod && match.status === "LIVE",
    isPaused: !match.clockRunning && match.status === "LIVE",
  };
}

/** Texto compacto para listas (ex.: card ao vivo). */
export function formatLiveClockCompact(
  match: MatchClockDisplayFields,
  events: MatchEventLike[] = [],
  now = new Date()
): string {
  const d = buildPublicMatchClockDisplay(match, events, now);
  if (!d.showCountdown) return d.periodLabel;
  return `${d.periodLabel} · ${formatElapsedClock(d.remainingSeconds)}`;
}

/** Duas linhas: período + regressivo; opcional tempo de jogo. */
export function formatLiveClockLines(
  match: MatchClockDisplayFields,
  events: MatchEventLike[] = [],
  now = new Date()
): { primary: string; secondary: string | null; periodLabel: string } {
  const d = buildPublicMatchClockDisplay(match, events, now);
  if (!d.showCountdown) {
    return { primary: d.periodLabel, secondary: null, periodLabel: d.periodLabel };
  }
  const primary = formatElapsedClock(d.remainingSeconds);
  const secondary = `Tempo de jogo ${formatElapsedClock(d.totalGameSeconds)}`;
  return { primary, secondary, periodLabel: d.periodLabel };
}
