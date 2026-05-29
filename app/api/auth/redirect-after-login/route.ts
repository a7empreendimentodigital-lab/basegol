import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolvePostLoginPath } from "@/lib/auth-redirect";
import { getCanonicalOrigin, normalizeCallbackPath, toCanonicalUrl } from "@/lib/app-origin";

export async function GET(request: Request) {
  const canonicalOrigin = getCanonicalOrigin(request.url);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    const login = toCanonicalUrl("/login", request.url);
    const callbackPath = normalizeCallbackPath(
      new URL(request.url).searchParams.get("callbackUrl"),
      request.url
    );
    if (callbackPath) {
      login.searchParams.set("callbackUrl", callbackPath);
    }
    return NextResponse.redirect(login);
  }

  const url = new URL(request.url);
  const path = resolvePostLoginPath({
    role: session.user.role,
    mustChangePassword: session.user.mustChangePassword,
    callbackUrl: url.searchParams.get("callbackUrl"),
    origin: canonicalOrigin,
  });

  return NextResponse.redirect(new URL(path, canonicalOrigin));
}
