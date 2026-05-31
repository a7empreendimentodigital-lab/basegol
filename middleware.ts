import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { toCanonicalUrl } from "@/lib/app-origin";
import { canAccessRoute } from "@/lib/rbac";
import { isClubPortalRoute } from "@/lib/public-routes";

function nextWithPathname(req: NextRequestWithAuth) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
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

    if (!canAccessRoute(effectiveRole, pathname)) {
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
    "/((?!_next/static|_next/image|favicon.ico|assets|manifest.webmanifest|sw.js|api).*)",
  ],
};
