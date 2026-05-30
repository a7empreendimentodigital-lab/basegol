"use client";

import { useCallback, useEffect, useState } from "react";
import { parseApiResponse } from "@/lib/api-client";
import { LiveMatchCard } from "@/components/matches/LiveMatchCard";
import type { MatchWithTeams } from "@/types";

type ApiMatch = MatchWithTeams & { scheduledAt: string };

function fromApi(m: ApiMatch): MatchWithTeams {
  return {
    ...m,
    scheduledAt: new Date(m.scheduledAt),
  };
}

export function LiveMatchesPoller({ initialMatches }: { initialMatches: MatchWithTeams[] }) {
  const [matches, setMatches] = useState(initialMatches);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/matches?status=LIVE", { cache: "no-store" });
    if (!res.ok) return;
    const data = await parseApiResponse<ApiMatch[]>(res);
    if (Array.isArray(data)) {
      setMatches(data.map(fromApi));
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => void refresh(), 3000);
    return () => clearInterval(t);
  }, [refresh]);

  if (!matches.length) return null;

  return (
    <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1 scrollbar-hide">
      {matches.map((m) => (
        <LiveMatchCard key={m.id} match={m} />
      ))}
    </div>
  );
}
