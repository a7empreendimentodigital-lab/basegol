import { normalizeAthleteCategory } from "@/lib/athlete-category";

const BR_OFFSET = "-03:00";

/** Horário padrão dos jogos por categoria (fuso America/Sao_Paulo). */
export const CATEGORY_MATCH_TIMES: Record<string, { hour: number; minute: number }> = {
  "Sub-11": { hour: 14, minute: 30 },
  "Sub-12": { hour: 16, minute: 0 },
};

export function getCategoryMatchTime(
  categoryName: string | null | undefined
): { hour: number; minute: number } | null {
  const norm = normalizeAthleteCategory(categoryName);
  return CATEGORY_MATCH_TIMES[norm] ?? null;
}

/** Mantém a data do jogo e aplica o horário oficial da categoria em São Paulo. */
export function setTimeInBrazil(date: Date, hour: number, minute: number): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${y}-${m}-${d}T${hh}:${mm}:00${BR_OFFSET}`);
}

export function applyCategoryMatchTime(
  scheduledAt: Date,
  categoryName: string | null | undefined
): Date {
  const slot = getCategoryMatchTime(categoryName);
  if (!slot) return scheduledAt;
  return setTimeInBrazil(scheduledAt, slot.hour, slot.minute);
}
