"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parseApiResponse } from "@/lib/api-client";
import { TeamCrest } from "@/components/matches/TeamCrest";

type OperatorMatch = {
  id: string;
  status: string;
  homeScore: number;
  awayScore: number;
  minute: number | null;
  homeTeam: { club: { name: string } };
  awayTeam: { club: { name: string } };
};

export default function OperadorPage() {
  const [matches, setMatches] = useState<OperatorMatch[]>([]);

  useEffect(() => {
    void fetch("/api/operator/matches")
      .then(async (r) => {
        if (!r.ok) return [];
        return parseApiResponse<OperatorMatch[]>(r);
      })
      .then((data) => setMatches(Array.isArray(data) ? data : []))
      .catch(() => setMatches([]));
  }, []);

  return (
    <main className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-3">
        <h1 className="font-display text-2xl tracking-wide">Partidas</h1>
        {matches.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma partida atribuída.</p>
        )}
        <div className="space-y-2">
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/operador/partida/${m.id}`}
              className="rounded-2xl border border-line bg-graphite-light p-3 block hover:bg-graphite transition-colors"
            >
              <div className="flex items-center gap-3">
                <TeamCrest url={null} name={m.homeTeam.club.name} size="sm" />
                <p className="text-sm font-medium flex-1">
                  {m.homeTeam.club.name}{" "}
                  <span className="tabular-nums">
                    {m.homeScore} x {m.awayScore}
                  </span>{" "}
                  {m.awayTeam.club.name}
                </p>
                <TeamCrest url={null} name={m.awayTeam.club.name} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground">
                {m.status} {m.minute != null ? `· ${m.minute}'` : ""}
              </p>
            </Link>
          ))}
        </div>
    </main>
  );
}
