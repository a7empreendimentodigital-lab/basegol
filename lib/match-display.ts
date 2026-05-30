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
  status: string;
  matchPeriod?: string | null;
  minute?: number | null;
  elapsedSeconds?: number;
  clockRunning?: boolean;
  clockStartedAt?: Date | string | null;
  periodLengthMin?: number;
  periodCount?: number;
};

export function formatLiveClock(
  status: string,
  minute: number | null,
  match?: LiveClockMatch | null
): string {
  if (match?.matchPeriod === "PENALTY_SHOOTOUT") return "Disputa de Pênaltis";
  if (match?.matchPeriod === "HALFTIME" || status === "HALFTIME") return "Intervalo";
  if (match?.matchPeriod === "FIRST_HALF") {
    const sec = match.elapsedSeconds ?? (minute != null ? minute * 60 : 0);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `1º Tempo · ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  if (match?.matchPeriod === "SECOND_HALF") {
    const sec = match.elapsedSeconds ?? (minute != null ? minute * 60 : 0);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `2º Tempo · ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  if (match?.matchPeriod === "THIRD_HALF") {
    const sec = match.elapsedSeconds ?? (minute != null ? minute * 60 : 0);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `3º Tempo · ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  if (status === "HALFTIME") return "Intervalo";
  if (minute == null) return "Ao vivo";
  const period = minute <= 17 ? "1º Tempo" : minute <= 34 ? "2º Tempo" : "3º Tempo";
  const clock = `${String(minute).padStart(2, "0")}:00`;
  return `${period} - ${clock}`;
}

export function matchProgressPercent(status: string, minute: number | null): number {
  if (status === "HALFTIME") return 50;
  if (minute == null) return 0;
  return Math.min(100, Math.round((minute / 90) * 100));
}
