"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ChampionshipSponsorPlacement } from "@prisma/client";
import { Pencil } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { parseApiResponse } from "@/lib/api-client";
import { sponsorCtr } from "@/lib/championship-sponsor-analytics";
import { CHAMPIONSHIP_SPONSOR_PLACEMENT_LABELS } from "@/lib/championship-sponsor-labels";

type SponsorRow = {
  id: string;
  name: string;
  logoUrl: string | null;
  linkUrl: string | null;
  placement: ChampionshipSponsorPlacement;
  order: number;
  isActive: boolean;
  impressionCount: number;
  clickCount: number;
  championship: { id: string; name: string; slug: string };
};

export function ChampionshipSponsorsGlobalAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<SponsorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/championship-sponsors", { cache: "no-store" });
      const data = await parseApiResponse<{ items: SponsorRow[] }>(res);
      setItems(data?.items ?? []);
    } catch {
      toast({ title: "Não foi possível carregar patrocinadores", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, { championship: SponsorRow["championship"]; sponsors: SponsorRow[] }>();
    for (const row of items) {
      const key = row.championship.id;
      const entry = map.get(key);
      if (entry) entry.sponsors.push(row);
      else map.set(key, { championship: row.championship, sponsors: [row] });
    }
    return [...map.values()].sort((a, b) =>
      a.championship.name.localeCompare(b.championship.name, "pt-BR")
    );
  }, [items]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Patrocinadores por campeonato"
        description="Visualize patrocinadores de todos os campeonatos. Edite em cada campeonato pelo botão Gerenciar."
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-line/60 bg-graphite/30 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum patrocinador cadastrado em nenhum campeonato.
        </p>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ championship, sponsors }) => (
            <section key={championship.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg text-foreground">{championship.name}</h2>
                <Link href={`/admin/campeonatos/${championship.id}/patrocinadores`}>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Gerenciar patrocinadores
                  </Button>
                </Link>
              </div>
              <ul className="divide-y divide-line rounded-lg border border-line overflow-hidden">
                {sponsors.map((row) => {
                  const ctr = sponsorCtr(row.impressionCount, row.clickCount);
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center gap-3 bg-graphite/20 px-4 py-3 sm:grid sm:grid-cols-[auto_1fr_6rem_auto] sm:items-center"
                    >
                      <Thumb src={row.logoUrl ?? ""} alt={row.name} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {CHAMPIONSHIP_SPONSOR_PLACEMENT_LABELS[row.placement]} · Ordem {row.order}
                        </p>
                        <p className="text-[10px] text-muted-foreground/80 mt-1">
                          Exibições {row.impressionCount} · Cliques {row.clickCount} · CTR {ctr}%
                        </p>
                      </div>
                      <StatusBadge
                        status={row.isActive ? "ACTIVE" : "INACTIVE"}
                        label={row.isActive ? "Ativo" : "Inativo"}
                      />
                      <Link
                        href={`/admin/campeonatos/${championship.id}/patrocinadores`}
                        className="text-xs text-primary hover:underline"
                      >
                        Editar
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
