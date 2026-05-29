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

export function formatLiveClock(status: string, minute: number | null): string {
  if (status === "HALFTIME") return "Intervalo";
  if (minute == null) return "Ao vivo";
  const period = minute <= 45 ? "1º Tempo" : "2º Tempo";
  const clock = `${String(minute).padStart(2, "0")}:00`;
  return `${period} - ${clock}`;
}

export function matchProgressPercent(status: string, minute: number | null): number {
  if (status === "HALFTIME") return 50;
  if (minute == null) return 0;
  return Math.min(100, Math.round((minute / 90) * 100));
}
