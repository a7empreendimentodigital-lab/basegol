"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChampionshipSponsorPlacement } from "@prisma/client";
import { Pencil, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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

type ChampionshipOption = { id: string; name: string };

export function ChampionshipSponsorsGlobalAdmin() {
  const { toast } = useToast();
  const router = useRouter();
  const [items, setItems] = useState<SponsorRow[]>([]);
  const [championships, setChampionships] = useState<ChampionshipOption[]>([]);
  const [selectedChampionshipId, setSelectedChampionshipId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sponsorsRes, champsRes] = await Promise.all([
        fetch("/api/admin/championship-sponsors", { cache: "no-store" }),
        fetch("/api/admin/crud/championships?page=1&pageSize=100", { cache: "no-store" }),
      ]);
      const sponsorsData = await parseApiResponse<{ items: SponsorRow[] }>(sponsorsRes);
      const champsPayload = await parseApiResponse<{ items: ChampionshipOption[] }>(champsRes);
      const champList = champsPayload?.items ?? [];
      setItems(sponsorsData?.items ?? []);
      const sorted = [...champList].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      setChampionships(sorted);
      if (sorted.length === 1) {
        setSelectedChampionshipId(sorted[0]!.id);
      }
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

  function goToCreate() {
    if (!selectedChampionshipId) {
      toast({
        title: "Selecione um campeonato",
        description: "Escolha o campeonato em que deseja cadastrar o patrocinador.",
        variant: "error",
      });
      return;
    }
    router.push(
      `/admin/campeonatos/${selectedChampionshipId}/patrocinadores?new=1`
    );
  }

  const headerAction = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end shrink-0">
      <div className="min-w-[200px]">
        <Label htmlFor="sp-champ" className="text-xs text-muted-foreground mb-1 block">
          Campeonato
        </Label>
        <Select
          id="sp-champ"
          value={selectedChampionshipId}
          onChange={(e) => setSelectedChampionshipId(e.target.value)}
        >
          <option value="">Selecione…</option>
          {championships.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <Button type="button" onClick={goToCreate} className="gap-2">
        <Plus className="h-4 w-4" aria-hidden />
        Novo patrocinador
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Patrocinadores por campeonato"
        description="Cadastre patrocinadores por campeonato. Eles aparecem na área pública apenas do campeonato vinculado."
        action={headerAction}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-line/60 bg-graphite/30 px-4 py-8 space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Nenhum patrocinador cadastrado em nenhum campeonato.
          </p>
          {championships.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2">
              {championships.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/campeonatos/${c.id}/patrocinadores?new=1`}
                >
                  <Button type="button" variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    Cadastrar em {c.name}
                  </Button>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ championship, sponsors }) => (
            <section key={championship.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg text-foreground">{championship.name}</h2>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/campeonatos/${championship.id}/patrocinadores?new=1`}>
                    <Button type="button" size="sm" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                      Novo patrocinador
                    </Button>
                  </Link>
                  <Link href={`/admin/campeonatos/${championship.id}/patrocinadores`}>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Gerenciar
                    </Button>
                  </Link>
                </div>
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
