import {
  getPeriodElapsedSeconds,
  resolveElapsedSeconds,
  resolveMatchPeriodForDisplay,
} from "@/lib/match-live";
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
  periodEvents?: { type: string; description?: string | null }[];
  minute?: number | null;
  elapsedSeconds?: number;
  clockRunning?: boolean;
  clockStartedAt?: Date | string | null;
  periodLengthMin?: number;
  periodCount?: number;
};

function formatPeriodClock(match: LiveClockMatch, period: string): string {
  const clockMatch = {
    status: match.status ?? "LIVE",
    matchPeriod: period,
    minute: match.minute ?? null,
    elapsedSeconds: match.elapsedSeconds ?? 0,
    clockRunning: match.clockRunning ?? false,
    clockStartedAt: match.clockStartedAt ?? null,
    periodLengthMin: match.periodLengthMin ?? 17,
    periodCount: match.periodCount ?? 3,
  };
  const sec = getPeriodElapsedSeconds(clockMatch, period);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const clock = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  if (period === "FIRST_HALF") return `1º Tempo · ${clock}`;
  if (period === "SECOND_HALF") return `2º Tempo · ${clock}`;
  if (period === "THIRD_HALF") return `3º Tempo · ${clock}`;
  return clock;
}

export function formatLiveClock(
  status: string,
  minute: number | null,
  match?: LiveClockMatch | null
): string {
  if (!match) {
    if (status === "HALFTIME") return "Intervalo";
    if (minute == null) return "Ao vivo";
    return `Ao vivo · ${minute}'`;
  }

  const period = resolveMatchPeriodForDisplay(
    {
      status,
      matchPeriod: match.matchPeriod ?? "SCHEDULED",
      minute: match.minute ?? null,
      elapsedSeconds: match.elapsedSeconds ?? 0,
      clockRunning: match.clockRunning ?? false,
      clockStartedAt: match.clockStartedAt ?? null,
      periodLengthMin: match.periodLengthMin ?? 17,
      periodCount: match.periodCount ?? 3,
    },
    match.periodEvents ?? []
  );

  if (period === "PENALTY_SHOOTOUT") return "Disputa de Pênaltis";
  if (period === "HALFTIME" || status === "HALFTIME") return "Intervalo";
  if (
    period === "FIRST_HALF" ||
    period === "SECOND_HALF" ||
    period === "THIRD_HALF"
  ) {
    return formatPeriodClock({ ...match, status }, period);
  }
  if (status === "HALFTIME") return "Intervalo";
  if (minute == null) return "Ao vivo";

  const len = match.periodLengthMin ?? 17;
  const elapsed = resolveElapsedSeconds({
    status,
    matchPeriod: match.matchPeriod ?? "SCHEDULED",
    minute,
    elapsedSeconds: match.elapsedSeconds ?? 0,
    clockRunning: match.clockRunning ?? false,
    clockStartedAt: match.clockStartedAt ?? null,
    periodLengthMin: len,
    periodCount: match.periodCount ?? 3,
  });
  const periodSec = len * 60;
  const fallbackPeriod =
    elapsed >= periodSec * 2
      ? "THIRD_HALF"
      : elapsed > periodSec
        ? "SECOND_HALF"
        : "FIRST_HALF";
  return formatPeriodClock({ ...match, status }, fallbackPeriod);
}

export function matchProgressPercent(
  status: string,
  minute: number | null,
  match?: LiveClockMatch | null
): number {
  if (status === "HALFTIME") {
    const len = match?.periodLengthMin ?? 17;
    const total = (match?.periodCount ?? 3) * len * 60;
    return Math.round(((len * 60) / total) * 100);
  }
  const len = match?.periodLengthMin ?? 17;
  const count = match?.periodCount ?? 3;
  const totalSec = len * count * 60;
  const elapsed = match
    ? resolveElapsedSeconds({
        status,
        matchPeriod: match.matchPeriod ?? "SCHEDULED",
        minute,
        elapsedSeconds: match.elapsedSeconds ?? 0,
        clockRunning: match.clockRunning ?? false,
        clockStartedAt: match.clockStartedAt ?? null,
        periodLengthMin: len,
        periodCount: count,
      })
    : (minute ?? 0) * 60;
  return Math.min(100, Math.round((elapsed / totalSec) * 100));
}
