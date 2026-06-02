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

export type MatchCategoryFilterStatus = "LIVE" | "upcoming";

export function buildCategoryFilterHref(
  pathname: string,
  options?: {
    status?: MatchCategoryFilterStatus;
    categorySlug?: string | null;
  }
): string {
  const params = new URLSearchParams();
  if (options?.status === "LIVE") params.set("status", "LIVE");
  else if (options?.status === "upcoming") params.set("status", "upcoming");
  if (options?.categorySlug) params.set("categoria", options.categorySlug);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function resolveActiveCategorySlug(
  categoriaParam: string | undefined,
  categories: JogosCategoryOption[]
): string | null {
  if (!categoriaParam) return null;
  const valid = new Set(categories.map((c) => c.slug));
  return valid.has(categoriaParam) ? categoriaParam : null;
}

export function buildJogosHref(
  path: "/jogos" | "/jogos?status=LIVE" | "/jogos?status=upcoming",
  categorySlug?: string | null
): string {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  const status = params.get("status");
  return buildCategoryFilterHref(pathname, {
    status:
      status === "LIVE" ? "LIVE" : status === "upcoming" ? "upcoming" : undefined,
    categorySlug,
  });
}
