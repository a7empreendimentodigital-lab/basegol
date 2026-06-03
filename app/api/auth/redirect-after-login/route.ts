import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { resolvePostLoginPath } from "@/lib/auth-redirect";
import { getCanonicalOrigin, normalizeCallbackPath, toCanonicalUrl } from "@/lib/app-origin";

export async function GET(request: NextRequest) {
  const canonicalOrigin = getCanonicalOrigin(request.url);

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id) {
    console.warn("[auth] redirect-after-login: sessão JWT ausente (cookie não enviado ou secret incorreto)");
    const login = toCanonicalUrl("/login", request.url);
    const callbackPath = normalizeCallbackPath(
      request.nextUrl.searchParams.get("callbackUrl"),
      request.url
    );
    if (callbackPath) {
      login.searchParams.set("callbackUrl", callbackPath);
    }
    login.searchParams.set("error", "SessionRequired");
    return NextResponse.redirect(login);
  }

  const path = resolvePostLoginPath({
    role: token.role as string | undefined,
    mustChangePassword: Boolean(token.mustChangePassword),
    callbackUrl: request.nextUrl.searchParams.get("callbackUrl"),
    origin: canonicalOrigin,
    championshipId: (token.championshipId as string | null) ?? null,
  });

  return NextResponse.redirect(new URL(path, canonicalOrigin));
}
