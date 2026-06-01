/** Aceita ISO (YYYY-MM-DD) ou BR (DD/MM/YYYY). */
export function parseFlexibleDate(raw: string): Date | null {
  const t = raw.trim();
  if (!t) return null;

  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12, 0, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const br = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) {
    const d = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]), 12, 0, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(t);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
