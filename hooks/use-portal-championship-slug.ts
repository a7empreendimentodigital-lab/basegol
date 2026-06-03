"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  parseChampionshipSlugFromPath,
  readPortalChampionshipSlugFromDocumentCookie,
} from "@/lib/portal-championship-slug";

/** Slug do campeonato no portal público (URL ou cookie da última visita). */
export function usePortalChampionshipSlug(): string | null {
  const pathname = usePathname() ?? "/";
  const fromPath = parseChampionshipSlugFromPath(pathname);
  const [fromCookie, setFromCookie] = useState<string | null>(null);

  useEffect(() => {
    if (fromPath) {
      setFromCookie(null);
      return;
    }
    setFromCookie(readPortalChampionshipSlugFromDocumentCookie());
  }, [pathname, fromPath]);

  return fromPath ?? fromCookie;
}
