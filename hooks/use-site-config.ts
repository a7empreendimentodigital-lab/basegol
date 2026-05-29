"use client";

import { useEffect, useState } from "react";
import { parseApiResponse } from "@/lib/api-client";
import type { BrandConfigDTO, ThemeConfigDTO } from "@/types/cms";

type PublicConfig = {
  brand: BrandConfigDTO | null;
  theme: ThemeConfigDTO | null;
  sponsors: Array<{ id: string; name: string; logoUrl?: string | null; websiteUrl?: string | null }>;
  sections: Array<{ id: string; key: string; title?: string | null; subtitle?: string | null }>;
  texts: Array<{ id: string; key: string; value: string }>;
  menu: Array<{ id: string; label: string; href: string }>;
};

export function useSiteConfig() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/public/config")
      .then(async (res) => {
        if (!res.ok) return null;
        return parseApiResponse<PublicConfig>(res);
      })
      .then((data) => setConfig(data))
      .finally(() => setLoading(false));
  }, []);

  return { config, loading };
}
