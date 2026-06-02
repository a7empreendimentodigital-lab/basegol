import type { MatchWithTeams } from "@/types";

export type JogosCategoryOption = {
  slug: string;
  name: string;
};

/** Slug estável para query `categoria` na URL. */
export function categoryNameToSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function extractCategoriesFromMatches(matches: MatchWithTeams[]): JogosCategoryOption[] {
  const bySlug = new Map<string, string>();
  for (const match of matches) {
    const name = match.categoryName?.trim();
    if (!name) continue;
    const slug = categoryNameToSlug(name);
    if (slug) bySlug.set(slug, name);
  }
  return [...bySlug.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function filterMatchesByCategorySlug(
  matches: MatchWithTeams[],
  categorySlug: string | undefined
): MatchWithTeams[] {
  if (!categorySlug) return matches;
  return matches.filter((m) => {
    const name = m.categoryName?.trim();
    if (!name) return false;
    return categoryNameToSlug(name) === categorySlug;
  });
}

export function buildJogosHref(
  path: "/jogos" | "/jogos?status=LIVE" | "/jogos?status=upcoming",
  categorySlug?: string | null
): string {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  if (categorySlug) params.set("categoria", categorySlug);
  else params.delete("categoria");
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
