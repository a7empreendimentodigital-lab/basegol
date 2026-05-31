import { formatLiveClockCompact } from "@/lib/match-clock-display";
import { getPeriodElapsedSeconds } from "@/lib/match-live";
import { formatDate, formatTime } from "@/lib/utils";

export function formatRoundLabel(round: number): string {
  return `${round}ª Rodada`;
}

/** Data e hora do jogo para cards (ex.: "13 de jun. · 16:00"). */
export function formatMatchDateTime(scheduledAt: Date | string): string {
  return `${formatDate(scheduledAt, { day: "2-digit", month: "short" })} · ${formatTime(scheduledAt)}`;
}

/** Data curta em linha própria (ex.: "13 de jun."). */
export function formatMatchDateShort(scheduledAt: Date | string): string {
  return formatDate(scheduledAt, { day: "2-digit", month: "short" });
}

type LiveClockMatch = {
  status?: string;
  matchPeriod?: string | null;
  currentPhase?: string | null;
  phaseDurationSeconds?: number;
  phaseElapsedSeconds?: number;
  phaseStartedAt?: Date | string | null;
  isClockRunning?: boolean;
  periodsConfigured?: boolean;
  matchPeriodLabel?: string | null;
  showTotalGameTime?: boolean;
  periodEvents?: { type: string; description?: string | null }[];
  minute?: number | null;
  elapsedSeconds?: number;
  accumulatedPeriodSeconds?: number;
  clockRunning?: boolean;
  clockStartedAt?: Date | string | null;
  periodLengthMin?: number;
  periodCount?: number;
};

function toClockFields(match: LiveClockMatch, status: string) {
  const running = match.isClockRunning ?? match.clockRunning ?? false;
  return {
    status,
    currentPhase: match.currentPhase ?? undefined,
    matchPeriod: match.matchPeriod ?? "SCHEDULED",
    minute: match.minute ?? null,
    phaseDurationSeconds: match.phaseDurationSeconds,
    phaseElapsedSeconds: match.phaseElapsedSeconds,
    phaseStartedAt: match.phaseStartedAt ?? null,
    isClockRunning: running,
    periodsConfigured: match.periodsConfigured,
    matchPeriodLabel: match.matchPeriodLabel,
    showTotalGameTime: match.showTotalGameTime,
    elapsedSeconds: match.elapsedSeconds ?? match.phaseElapsedSeconds ?? 0,
    accumulatedPeriodSeconds: match.accumulatedPeriodSeconds ?? 0,
    clockRunning: running,
    clockStartedAt: match.phaseStartedAt ?? match.clockStartedAt ?? null,
    periodLengthMin: match.periodLengthMin ?? 17,
    periodCount: match.periodCount ?? 3,
  };
}

export function formatLiveClock(
  status: string,
  minute: number | null,
  match?: LiveClockMatch | null,
  now = new Date()
): string {
  if (!match) {
    if (status === "HALFTIME") return "Intervalo";
    if (minute == null) return "Ao vivo";
    return `Ao vivo · ${minute}'`;
  }
  return formatLiveClockCompact(
    toClockFields(match, status),
    match.periodEvents ?? [],
    now
  );
}

export function matchProgressPercent(
  status: string,
  minute: number | null,
  match?: LiveClockMatch | null,
  now = new Date()
): number {
  if (status === "HALFTIME") {
    const len = match?.periodLengthMin ?? 17;
    const total = (match?.periodCount ?? 3) * len * 60;
    return Math.round(((len * 60) / total) * 100);
  }
  const len = match?.periodLengthMin ?? 17;
  const periodSec = len * 60;
  const fields = match ? toClockFields(match, status) : null;
  const periodElapsed = fields
    ? getPeriodElapsedSeconds(fields, undefined, now)
    : (minute ?? 0) * 60;
  return Math.min(100, Math.round((periodElapsed / periodSec) * 100));
}
