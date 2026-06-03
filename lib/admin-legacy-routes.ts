/** Rotas globais antigas — gestão passou para `/admin/campeonatos/[id]`. */
export const LEGACY_CHAMPIONSHIP_ADMIN_PATHS = [
  "/admin/categorias",
  "/admin/grupos",
  "/admin/jogos",
  "/admin/clubes",
  "/admin/atletas",
  "/admin/comissao",
  "/admin/noticias",
  "/admin/importacao-paulista",
  "/admin/importacao-tabela",
  "/admin/importacao-jogos",
  "/admin/importacao-atletas",
  "/admin/importacao-resultados",
] as const;

export function isLegacyChampionshipAdminPath(pathname: string) {
  return LEGACY_CHAMPIONSHIP_ADMIN_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function legacyChampionshipAdminRedirect(championshipId?: string | null) {
  if (championshipId) {
    return `/admin/campeonatos/${championshipId}`;
  }
  return "/admin/campeonatos";
}
