"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Layers, Pencil, RefreshCw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { GroupForm } from "@/components/admin/forms/GroupForm";
import { GROUP_STATUS_LABELS } from "@/lib/admin-labels";
import { parseApiResponse } from "@/lib/api-client";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toaster";
export type GroupRow = {
  id: string;
  name: string;
  status: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    championship?: { id: string; name: string; season: string };
  };
};

type CategorySection = {
  categoryId: string;
  categoryName: string;
  championshipLabel: string;
  groups: GroupRow[];
};

function sortGroupName(a: string, b: string) {
  const num = (s: string) => {
    const m = s.match(/\d+/);
    return m ? Number(m[0]) : Number.MAX_SAFE_INTEGER;
  };
  const diff = num(a) - num(b);
  if (diff !== 0) return diff;
  return a.localeCompare(b, "pt-BR");
}

function groupByCategory(items: GroupRow[]): CategorySection[] {
  const map = new Map<string, CategorySection>();

  for (const row of items) {
    const cat = row.category;
    const categoryId = row.categoryId;
    const categoryName = cat?.name ?? "Sem categoria";
    const championshipLabel = cat?.championship
      ? `${cat.championship.name} (${cat.championship.season})`
      : "—";

    if (!map.has(categoryId)) {
      map.set(categoryId, {
        categoryId,
        categoryName,
        championshipLabel,
        groups: [],
      });
    }
    map.get(categoryId)!.groups.push(row);
  }

  return [...map.values()]
    .map((section) => ({
      ...section,
      groups: [...section.groups].sort((a, b) => sortGroupName(a.name, b.name)),
    }))
    .sort((a, b) => {
      const champ = a.championshipLabel.localeCompare(b.championshipLabel, "pt-BR");
      if (champ !== 0) return champ;
      return a.categoryName.localeCompare(b.categoryName, "pt-BR");
    });
}

export function GroupsByCategoryList() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<GroupRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncingRoster, setSyncingRoster] = useState(false);
  const [syncingFixtures, setSyncingFixtures] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GroupRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "200" });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/crud/groups?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = await parseApiResponse<{ items: GroupRow[]; total: number }>(res);
      setItems(data.items ?? []);
    } catch {
      setItems([]);
      toast({ title: "Erro ao carregar dados", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [q, toast]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const sections = useMemo(() => groupByCategory(items), [items]);
  const totalGroups = items.length;

  async function handleDelete(row: GroupRow) {
    const ok = await confirm({
      title: `Excluir ${row.name}?`,
      description: "Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/crud/groups/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
      toast({ title: "Grupo excluído", variant: "success" });
      await load();
    } catch (e) {
      toast({
        title: "Erro ao excluir",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    }
  }

  async function syncOfficialRoster() {
    const ok = await confirm({
      title: "Sincronizar lista FPF nos grupos?",
      description:
        "Substitui os grupos pela lista oficial da federação: clubes fora da lista são removidos e podem ser movidos de grupo.\n\nNão use se você já montou os grupos manualmente. Prefira ajustar clubes em cada grupo e importar jogos por rodada.",
      confirmLabel: "Sincronizar grupos",
      variant: "destructive",
    });
    if (!ok) return;
    setSyncingRoster(true);
    try {
      const res = await fetch("/api/admin/sync-group-roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || "Falha na sincronização");
      }
      const data = json.data as {
        added: number;
        removed: number;
        moved: number;
        missingClub: number;
      };
      toast({
        title: "Grupos sincronizados",
        description: `+${data.added} inscrições · ${data.removed} removidos · ${data.moved} movidos${data.missingClub ? ` · ${data.missingClub} clube(s) não encontrado(s)` : ""}`,
        variant: "success",
      });
      await load();
    } catch (e) {
      toast({
        title: "Erro ao sincronizar",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setSyncingRoster(false);
    }
  }

  async function syncFixturesFromGroups() {
    const ok = await confirm({
      title: "Atualizar jogos pelos grupos?",
      description:
        "Importa jogos do pacote FPF (fixtures.csv) sem alterar os grupos que você já ajustou.\n\nUse “Sincronizar lista FPF” apenas se quiser substituir clubes nos grupos pela lista oficial.",
      confirmLabel: "Importar jogos",
    });
    if (!ok) return;
    setSyncingFixtures(true);
    try {
      const res = await fetch("/api/admin/sync-group-fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncRosterFirst: false }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || "Falha ao atualizar jogos");
      }
      const data = json.data as {
        import: {
          matchesCreated: number;
          matchesSkippedDuplicate: number;
          errors: number;
        };
        matchesReconciled: number;
        roster?: { added: number; removed: number; moved: number };
      };
      const roster = data.roster;
      toast({
        title: "Jogos atualizados",
        description: [
          roster
            ? `Grupos: +${roster.added} · ${roster.removed} removidos · ${roster.moved} movidos`
            : null,
          `${data.import.matchesCreated} jogo(s) importado(s)`,
          data.import.matchesSkippedDuplicate
            ? `${data.import.matchesSkippedDuplicate} já existiam`
            : null,
          data.matchesReconciled
            ? `${data.matchesReconciled} jogo(s) reassociado(s) ao grupo`
            : null,
          data.import.errors ? `${data.import.errors} erro(s)` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        variant: data.import.errors > 0 ? "error" : "success",
      });
      await load();
    } catch (e) {
      toast({
        title: "Erro ao atualizar jogos",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setSyncingFixtures(false);
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Grupos"
        description="Grupos de classificação organizados por categoria."
        onNew={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      />

      <div className="glass-card mb-4 flex flex-wrap items-center gap-3 p-4">
        <Button
          type="button"
          variant="outline"
          disabled={syncingRoster || syncingFixtures}
          onClick={() => void syncOfficialRoster()}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncingRoster ? "animate-spin" : ""}`} aria-hidden />
          {syncingRoster ? "Sincronizando…" : "Sincronizar lista FPF"}
        </Button>
        <Button
          type="button"
          variant="default"
          disabled={syncingRoster || syncingFixtures}
          onClick={() => void syncFixturesFromGroups()}
          className="gap-2"
        >
          <CalendarDays
            className={`h-4 w-4 ${syncingFixtures ? "animate-pulse" : ""}`}
            aria-hidden
          />
          {syncingFixtures ? "Importando jogos…" : "Importar jogos (FPF)"}
        </Button>
        <div className="flex min-w-[200px] flex-1 gap-2">
          <Input
            placeholder="Buscar grupo ou categoria..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load()}
          />
          <Button type="button" variant="outline" onClick={() => void load()}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          {totalGroups} grupo{totalGroups !== 1 ? "s" : ""} · {sections.length} categoria
          {sections.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card h-32 animate-pulse rounded-xl bg-secondary/30" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">
          Nenhum grupo encontrado.
        </div>
      ) : (
        <div className="space-y-5">
          {sections.map((section) => (
            <section
              key={section.categoryId}
              className="glass-card overflow-hidden"
            >
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-pitch/40 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {section.championshipLabel}
                  </p>
                  <h2 className="mt-0.5 font-display text-xl tracking-wide text-foreground">
                    {section.categoryName}
                  </h2>
                </div>
                <span className="rounded-full border border-line bg-graphite-light px-3 py-1 text-xs font-medium text-muted-foreground">
                  {section.groups.length} grupo{section.groups.length !== 1 ? "s" : ""}
                </span>
              </header>

              <ul className="divide-y divide-line/40">
                {section.groups.map((group) => (
                  <li
                    key={group.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 hover:bg-secondary/15 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{group.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {GROUP_STATUS_LABELS[group.status] ?? group.status}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(group);
                          setDialogOpen(true);
                        }}
                        aria-label={`Editar ${group.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(group)}
                        aria-label={`Excluir ${group.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          title={editing ? "Editar grupo" : "Novo grupo"}
          description="Defina a categoria e o nome do grupo de classificação."
          className="max-w-3xl"
        >
          <GroupForm
            key={editing?.id ?? "new"}
            initial={(editing as Record<string, unknown>) ?? null}
            onSuccess={() => {
              setDialogOpen(false);
              setEditing(null);
              void load();
              toast({
                title: editing ? "Grupo atualizado" : "Grupo criado",
                variant: "success",
              });
            }}
            onCancel={() => {
              setDialogOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
