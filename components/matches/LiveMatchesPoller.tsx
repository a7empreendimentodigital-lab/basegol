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

type Props = {
  initialMatches: MatchWithTeams[];
  /** Quando definido, atualização em tempo real só deste campeonato. */
  championshipSlug?: string;
};

export function LiveMatchesPoller({ initialMatches, championshipSlug }: Props) {
  const [matches, setMatches] = useState(initialMatches);

  useEffect(() => {
    setMatches(initialMatches);
  }, [initialMatches, championshipSlug]);

  const refresh = useCallback(async () => {
    const params = new URLSearchParams({ status: "LIVE" });
    if (championshipSlug) {
      params.set("championshipSlug", championshipSlug);
    }
    const res = await fetch(`/api/matches?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await parseApiResponse<ApiMatch[]>(res);
    if (Array.isArray(data)) {
      setMatches(data.map(fromApi));
    }
  }, [championshipSlug]);

  useEffect(() => {
    const t = setInterval(() => void refresh(), 3000);
    return () => clearInterval(t);
  }, [refresh]);

  if (!matches.length) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:overflow-x-auto sm:pb-1 scrollbar-hide">
      {matches.map((m) => (
        <LiveMatchCard key={m.id} match={m} />
      ))}
    </div>
  );
}
