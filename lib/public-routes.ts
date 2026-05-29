const AUTH_PATHS = ["/login", "/reset-senha", "/primeiro-acesso"];

/** Painel do clube logado: /clube e /clube/... — não confundir com /clubes (lista pública). */
export function isClubPortalRoute(pathname: string) {
  return pathname === "/clube" || pathname.startsWith("/clube/");
}

export function isAuthRoute(pathname: string) {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isPublicAppRoute(pathname: string) {
  if (isAuthRoute(pathname)) return false;
  if (pathname.startsWith("/admin")) return false;
  if (isClubPortalRoute(pathname)) return false;
  if (pathname.startsWith("/operador")) return false;
  if (pathname.startsWith("/partida")) return false;
  return true;
}
