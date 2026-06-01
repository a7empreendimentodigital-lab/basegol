/** Prévia do pacote FPF no navegador (sem chamar API). */
export type PaulistaPackClientPreview = {
  season: number;
  categories: Array<{
    categoryHint: string;
    participants: number;
    matches: number;
    warnings: string[];
  }>;
  totals: { participants: number; matches: number };
};

export function normalizePaulistaCategory(value: string): string {
  const trimmed = value.trim();
  const sub = trimmed.match(/\bsub[-\s]?(\d{1,2})\b/i);
  if (sub) return `Sub-${sub[1]}`;
  return trimmed;
}

export function previewPaulistaPackFromJson(raw: unknown): PaulistaPackClientPreview {
  if (!raw || typeof raw !== "object") {
    throw new Error("Arquivo JSON inválido.");
  }
  const data = raw as {
    competitions?: Array<{ season?: number }>;
    group_teams?: Array<{ competition_category: string }>;
    fixtures?: Array<{ category: string }>;
  };

  const groupTeams = data.group_teams ?? [];
  const fixtures = data.fixtures ?? [];
  if (groupTeams.length === 0) {
    throw new Error('Pacote inválido: falta "group_teams". Use basegol_paulista_import_2026.json.');
  }

  const season = data.competitions?.[0]?.season ?? 2026;
  const categoryHints = new Set<string>();
  for (const g of groupTeams) {
    categoryHints.add(normalizePaulistaCategory(g.competition_category));
  }
  for (const f of fixtures) {
    categoryHints.add(normalizePaulistaCategory(f.category));
  }

  const sorted = [...categoryHints].sort((a, b) => {
    const na = Number(a.match(/(\d+)/)?.[1] ?? 99);
    const nb = Number(b.match(/(\d+)/)?.[1] ?? 99);
    return na - nb;
  });

  const categories = sorted.map((categoryHint) => ({
    categoryHint,
    participants: groupTeams.filter(
      (g) => normalizePaulistaCategory(g.competition_category) === categoryHint
    ).length,
    matches: fixtures.filter((f) => normalizePaulistaCategory(f.category) === categoryHint).length,
    warnings: [] as string[],
  }));

  return {
    season,
    categories,
    totals: {
      participants: groupTeams.length,
      matches: fixtures.length,
    },
  };
}
