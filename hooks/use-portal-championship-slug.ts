"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { resolvePortalChampionshipSlug } from "@/lib/portal-championship-scope";
import { readPortalChampionshipSlugFromDocumentCookie } from "@/lib/portal-championship-slug";

/** Slug do campeonato no portal público (URL ou cookie em rotas permitidas). */
export function usePortalChampionshipSlug(): string | null {
  const pathname = usePathname() ?? "/";
  const [cookieSlug, setCookieSlug] = useState<string | null>(null);

  useEffect(() => {
    setCookieSlug(readPortalChampionshipSlugFromDocumentCookie());
  }, [pathname]);

  return resolvePortalChampionshipSlug(pathname, cookieSlug);
}
