"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { parseApiResponse } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

type ReportData = {
  clubsByStatus: { status: string; _count: { id: number } }[];
  goals: number;
  pendingDocs: number;
  topAthletes: { name: string; club: string; shirtNumber: number | null }[];
  recentMatches: { id: string; label: string; status: string; scheduledAt: string }[];
};

export default function AdminRelatoriosPage() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    void fetch("/api/admin/reports")
      .then(async (r) => (r.ok ? parseApiResponse<ReportData>(r) : null))
      .then(setData);
  }, []);

  return (
    <div className="max-w-6xl space-y-6">
      <AdminPageHeader
        title="Relatórios"
        description="Resumos operacionais da temporada e indicadores do sistema."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Gols registrados</p>
          <p className="font-display text-3xl text-neon">{data?.goals ?? "—"}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Documentos pendentes</p>
          <p className="font-display text-3xl text-neon">{data?.pendingDocs ?? "—"}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Status dos clubes</p>
          <div className="mt-2 space-y-1 text-sm">
            {data?.clubsByStatus.map((c) => (
              <p key={c.status}>
                {c.status}: {c._count.id}
              </p>
            ))}
          </div>
        </div>
      </div>
      <div className="glass-card p-4">
        <h3 className="font-semibold text-neon mb-3">Últimas partidas</h3>
        <div className="space-y-2">
          {data?.recentMatches.map((m) => (
            <div key={m.id} className="flex justify-between text-sm border-b border-border/50 py-2">
              <Link href={`/admin/partida/${m.id}/placar`} className="hover:text-neon">
                {m.label}
              </Link>
              <span className="text-muted-foreground">
                {m.status} · {formatDate(m.scheduledAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
