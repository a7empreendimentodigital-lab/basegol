export const PORTAL_CHAMPIONSHIP_COOKIE = "bg_portal_championship_slug";

/** Extrai o slug do campeonato em rotas `/campeonatos/[slug]/...`. */
export function parseChampionshipSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/campeonatos\/([^/]+)(?:\/|$)/);
  if (!match?.[1]) return null;
  if (match[1] === "page") return null;
  return decodeURIComponent(match[1]);
}

export function normalizePortalChampionshipSlug(value: string | undefined | null): string | null {
  const slug = value?.trim();
  if (!slug || slug === "page") return null;
  return slug;
}

export function portalChampionshipCookieOptions(slug: string) {
  return {
    name: PORTAL_CHAMPIONSHIP_COOKIE,
    value: slug,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax" as const,
  };
}

export function resolvePortalChampionshipSlug(
  pathname: string,
  persistedSlug?: string | null
): string | null {
  return (
    parseChampionshipSlugFromPath(pathname) ??
    normalizePortalChampionshipSlug(persistedSlug)
  );
}

export function readPortalChampionshipSlugFromDocumentCookie(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${PORTAL_CHAMPIONSHIP_COOKIE}=`;
  const part = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  if (!part) return null;
  const raw = part.slice(prefix.length);
  try {
    return normalizePortalChampionshipSlug(decodeURIComponent(raw));
  } catch {
    return normalizePortalChampionshipSlug(raw);
  }
}

export function championshipScopedPath(
  slug: string,
  segment: "" | "jogos" | "classificacao" | "clubes" | "noticias",
  search = ""
): string {
  const base = `/campeonatos/${encodeURIComponent(slug)}`;
  const path = segment ? `${base}/${segment}` : base;
  return search ? `${path}${search.startsWith("?") ? search : `?${search}`}` : path;
}
