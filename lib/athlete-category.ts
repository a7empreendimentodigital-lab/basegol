/** Normaliza texto de categoria do atleta (ex.: "sub 11" → "Sub-11"). */
export function normalizeAthleteCategory(value: string | null | undefined): string {
  if (!value?.trim()) return "Sem categoria";
  const trimmed = value.trim();
  const sub = trimmed.match(/\bsub[-\s]?(\d{1,2})\b/i);
  if (sub) return `Sub-${sub[1]}`;
  return trimmed;
}

function subSortKey(label: string): number {
  const m = label.match(/Sub-(\d+)/i);
  if (m) return Number(m[1]);
  if (label === "Sem categoria") return 999;
  return 500;
}

export function sortCategoryLabels(labels: string[]): string[] {
  return [...new Set(labels)].sort((a, b) => {
    const ka = subSortKey(a);
    const kb = subSortKey(b);
    if (ka !== kb) return ka - kb;
    return a.localeCompare(b, "pt-BR");
  });
}

export type SquadAthlete = {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  position: string;
  photoUrl: string | null;
  shirtNumber: number | null;
  category: string | null;
};

export function groupAthletesByCategory(
  athletes: SquadAthlete[],
  preferredOrder: string[] = []
): { category: string; athletes: SquadAthlete[] }[] {
  const buckets = new Map<string, SquadAthlete[]>();

  for (const athlete of athletes) {
    const key = normalizeAthleteCategory(athlete.category);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(athlete);
  }

  for (const list of buckets.values()) {
    list.sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "pt-BR")
    );
  }

  const order = sortCategoryLabels([
    ...preferredOrder.map(normalizeAthleteCategory),
    ...buckets.keys(),
  ]);

  return order
    .filter((cat) => buckets.has(cat))
    .map((category) => ({ category, athletes: buckets.get(category)! }));
}
