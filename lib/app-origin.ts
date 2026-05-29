/**
 * Em dev com `next dev --hostname 0.0.0.0`, cookies de sessão em localhost e 0.0.0.0
 * não são compartilhados. Normalizamos para o host do NEXTAUTH_URL (ou localhost).
 */
export function normalizeHostname(hostname: string): string {
  if (hostname === "0.0.0.0" || hostname === "[::]" || hostname === "::1") {
    return "localhost";
  }
  return hostname;
}

/** Origem canônica para redirects e cookies (ex.: http://localhost:3000). */
export function getCanonicalOrigin(requestUrl?: string | URL): string {
  const envUrl = process.env.NEXTAUTH_URL?.trim();
  if (envUrl) {
    try {
      return new URL(envUrl).origin;
    } catch {
      /* ignore */
    }
  }

  if (requestUrl) {
    const u = typeof requestUrl === "string" ? new URL(requestUrl) : new URL(requestUrl.toString());
    u.hostname = normalizeHostname(u.hostname);
    return u.origin;
  }

  return "http://localhost:3000";
}

export function toCanonicalUrl(pathOrUrl: string, requestUrl?: string | URL): URL {
  const origin = getCanonicalOrigin(requestUrl);
  return new URL(pathOrUrl, origin);
}

/** callbackUrl absoluto ou relativo → path+search na origem canônica. */
export function normalizeCallbackPath(callbackUrl: string | null | undefined, requestUrl?: string | URL): string | null {
  if (!callbackUrl?.trim()) return null;
  const origin = getCanonicalOrigin(requestUrl);
  try {
    const target = callbackUrl.startsWith("/")
      ? new URL(callbackUrl, origin)
      : new URL(callbackUrl);
    if (target.hostname !== new URL(origin).hostname && target.hostname !== "0.0.0.0") {
      const reqHost = requestUrl ? new URL(requestUrl.toString()).hostname : "";
      if (normalizeHostname(target.hostname) !== normalizeHostname(reqHost)) {
        return null;
      }
    }
    return `${target.pathname}${target.search}`;
  } catch {
    return callbackUrl.startsWith("/") ? callbackUrl : null;
  }
}
