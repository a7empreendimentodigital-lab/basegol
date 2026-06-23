import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { toCanonicalUrl } from "@/lib/app-origin";
import { isPortalEntryRoute } from "@/lib/portal-routes";
import {
  normalizePortalChampionshipSlug,
  parseChampionshipSlugFromPath,
  PORTAL_CHAMPIONSHIP_COOKIE,
  portalChampionshipCookieOptions,
} from "@/lib/portal-championship-slug";
import { canAccessRoute } from "@/lib/rbac";
import { isClubPortalRoute } from "@/lib/public-routes";

function nextWithPathname(req: NextRequestWithAuth) {
  const requestHeaders = new Headers(req.headers);
  const pathname = req.nextUrl.pathname;
  requestHeaders.set("x-pathname", pathname);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  const slug = normalizePortalChampionshipSlug(
    parseChampionshipSlugFromPath(pathname)
  );
  if (slug) {
    res.cookies.set(portalChampionshipCookieOptions(slug));
  } else if (isPortalEntryRoute(pathname)) {
    res.cookies.set({
      name: PORTAL_CHAMPIONSHIP_COOKIE,
      value: "",
      path: "/",
      maxAge: 0,
    });
  }
  return res;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    const isProtected =
      pathname.startsWith("/admin") ||
      isClubPortalRoute(pathname) ||
      pathname.startsWith("/operador") ||
      pathname.startsWith("/partida") ||
      pathname.startsWith("/primeiro-acesso");

    if (!isProtected) {
      return nextWithPathname(req);
    }

    if (!token?.id) {
      const login = toCanonicalUrl("/login", req.url);
      const returnPath = `${pathname}${req.nextUrl.search}`;
      login.searchParams.set("callbackUrl", returnPath);
      return NextResponse.redirect(login);
    }

    const role = String(token.role ?? "VISITANTE").toUpperCase();
    const impersonatedRole = req.cookies.get("bg_impersonate_role")?.value;
    const effectiveRole = role === "SUPER_ADMIN" && impersonatedRole ? impersonatedRole : role;

    if (
      token.mustChangePassword &&
      !pathname.startsWith("/primeiro-acesso/trocar-senha") &&
      !pathname.startsWith("/api/auth/change-password-first-access")
    ) {
      return NextResponse.redirect(toCanonicalUrl("/primeiro-acesso/trocar-senha", req.url));
    }

    const championshipId = token.championshipId as string | undefined;
    if (!canAccessRoute(effectiveRole, pathname, { championshipId })) {
      return NextResponse.redirect(toCanonicalUrl("/", req.url));
    }

    return nextWithPathname(req);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (
          path.startsWith("/admin") ||
          isClubPortalRoute(path) ||
          path.startsWith("/operador") ||
          path.startsWith("/partida") ||
          path.startsWith("/primeiro-acesso")
        ) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Não executar middleware em assets estáticos, API nem uploads.
     * uploads: servidos por public/ ou app/uploads/[...path]/route.ts
     */
    "/((?!api|_next/static|_next/image|favicon.ico|assets|uploads|manifest.webmanifest|sw.js).*)",
  ],
};
