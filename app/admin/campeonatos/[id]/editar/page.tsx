"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChampionshipForm } from "@/components/admin/forms/ChampionshipForm";
import { parseApiResponse } from "@/lib/api-client";

export default function ChampionshipAdminEditPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [initial, setInitial] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const res = await fetch(`/api/admin/crud/championships/${id}`);
      const data = await parseApiResponse<Record<string, unknown>>(res);
      setInitial(data);
      setLoading(false);
    })();
  }, [id]);

  if (loading || !id) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Editar campeonato</h1>
      <div className="glass-card p-6 max-w-2xl">
        <ChampionshipForm
          initial={initial}
          onSuccess={() => {
            window.location.href = `/admin/campeonatos/${id}`;
          }}
          onCancel={() => {
            window.location.href = `/admin/campeonatos/${id}`;
          }}
        />
      </div>
    </div>
  );
}
