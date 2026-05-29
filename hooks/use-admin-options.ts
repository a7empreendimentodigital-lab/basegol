"use client";

import { useEffect, useState } from "react";
import { parseApiResponse } from "@/lib/api-client";

export type SelectOption = { value: string; label: string; crestUrl?: string | null };

export function useAdminOptions(type: string, params?: Record<string, string | undefined>) {
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  const query = params
    ? "?" +
      Object.entries(params)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
        .join("&")
    : "";

  useEffect(() => {
    setLoading(true);
    void fetch(`/api/admin/options/${type}${query}`)
      .then(async (res) => {
        if (!res.ok) return [];
        return parseApiResponse<SelectOption[]>(res);
      })
      .then((data) => setOptions(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [type, query]);

  return { options, loading };
}
