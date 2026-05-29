"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { parseApiResponse } from "@/lib/api-client";

type Dash = {
  athletes: number;
  staff: number;
  documentsPending: number;
  registrations: number;
  upcomingMatches: number;
};

export default function ClubeEstatisticasPage() {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    void fetch("/api/club/dashboard")
      .then(async (r) => (r.ok ? parseApiResponse<Dash>(r) : null))
      .then(setData);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <AdminPageHeader title="Estatísticas" description="Indicadores do seu clube na plataforma." />
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Atletas cadastrados", data?.athletes],
          ["Comissão ativa", data?.staff],
          ["Documentos pendentes", data?.documentsPending],
          ["Inscrições", data?.registrations],
          ["Próximos jogos", data?.upcomingMatches],
        ].map(([label, value]) => (
          <div key={String(label)} className="glass-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-display text-3xl text-neon mt-1">{value ?? "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
