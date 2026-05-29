"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { parseApiResponse } from "@/lib/api-client";
import { MATCH_STATUS_LABELS } from "@/lib/admin-labels";
import { formatDate, formatTime } from "@/lib/utils";

type Match = {
  id: string;
  status: string;
  scheduledAt: string;
  homeScore: number;
  awayScore: number;
  homeTeam: { club: { name: string } };
  awayTeam: { club: { name: string } };
};

export default function ClubeJogosPage() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    void fetch("/api/club/matches")
      .then(async (r) => (r.ok ? parseApiResponse<Match[]>(r) : []))
      .then((d) => setMatches(Array.isArray(d) ? d : []));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <AdminPageHeader title="Jogos do clube" description="Calendário e resultados das partidas." />
      <div className="space-y-3">
        {matches.map((m) => (
          <div key={m.id} className="glass-card p-4 flex flex-wrap justify-between gap-3 items-center">
            <div>
              <p className="font-medium">
                {m.homeTeam.club.name} {m.homeScore} x {m.awayScore} {m.awayTeam.club.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(m.scheduledAt)} · {formatTime(m.scheduledAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={m.status} label={MATCH_STATUS_LABELS[m.status] ?? m.status} />
              {(m.status === "LIVE" || m.status === "HALFTIME") && (
                <Link href={`/jogos/${m.id}`} className="text-xs text-neon hover:underline">
                  Ver ao vivo
                </Link>
              )}
            </div>
          </div>
        ))}
        {!matches.length && <p className="text-sm text-muted-foreground">Nenhum jogo agendado.</p>}
      </div>
    </div>
  );
}
