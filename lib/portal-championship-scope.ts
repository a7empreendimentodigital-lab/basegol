import { isPortalEntryRoute } from "@/lib/portal-routes";
import { parseChampionshipSlugFromPath } from "@/lib/portal-championship-slug";

/** Rotas globais que podem redirecionar para o campeonato do cookie. */
const COOKIE_SCOPED_GLOBAL_PREFIXES = ["/jogos", "/tabela", "/clubes"] as const;

/** Conta / busca / favoritos — sem herdar campeonato do cookie. */
const COOKIE_EXCLUDED_PREFIXES = [
  "/favoritos",
  "/busca",
  "/configuracoes",
  "/login",
  "/reset-senha",
  "/primeiro-acesso",
] as const;

export function resolvePortalChampionshipSlug(
  pathname: string,
  cookieSlug: string | null | undefined
): string | null {
  const fromPath = parseChampionshipSlugFromPath(pathname);
  if (fromPath) return fromPath;

  if (!cookieSlug) return null;
  if (isPortalEntryRoute(pathname)) return null;

  for (const prefix of COOKIE_EXCLUDED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return null;
    }
  }

  for (const prefix of COOKIE_SCOPED_GLOBAL_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return cookieSlug;
    }
  }

  return null;
}
