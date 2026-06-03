/** Rotas institucionais (home de escolha, sobre, contato) — sem sidebar de competição. */
export function isPortalEntryRoute(pathname: string) {
  return pathname === "/" || pathname === "/sobre" || pathname === "/contato";
}

/** Portal de um campeonato e suas subpáginas. */
export function isChampionshipPortalRoute(pathname: string) {
  return pathname === "/campeonatos" || pathname.startsWith("/campeonatos/");
}

export const PORTAL_INSTITUTIONAL_NAV = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
] as const;

export function championshipNavPath(slug: string, segment?: string) {
  const base = `/campeonatos/${slug}`;
  if (!segment || segment === "inicio") return base;
  return `${base}/${segment}`;
}

export function categoryNavPath(championshipSlug: string, categorySlug: string) {
  return `/campeonatos/${championshipSlug}/categorias/${categorySlug}`;
}

export function isPaulistaPremiumChampionship(slug: string, name: string) {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();
  return s.includes("paulista") || n.includes("paulista");
}
