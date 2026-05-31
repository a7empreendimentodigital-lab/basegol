"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Search, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { AthleteForm } from "@/components/admin/forms/AthleteForm";
import { ATHLETE_STATUS_LABELS, PLAYER_POSITION_LABELS } from "@/lib/admin-labels";
import { groupAthletesByCategory, type SquadAthlete } from "@/lib/athlete-category";
import { clubSigla } from "@/lib/club-display";
import { parseApiResponse } from "@/lib/api-client";
import { categoryPillActive, categoryPillBase } from "@/lib/public-ui-classes";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

type AthleteRow = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  shirtNumber?: number | null;
  status: string;
  photoUrl?: string | null;
  category?: string | null;
  club?: { name: string; shortName?: string | null };
};

const PAGE_SIZE = 100;

function rowToSquad(row: AthleteRow): SquadAthlete {
  return {
    id: row.id,
    slug: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    position: row.position,
    photoUrl: row.photoUrl ?? null,
    shirtNumber: row.shirtNumber ?? null,
    category: row.category ?? null,
  };
}

function AthleteListRow({
  row,
  onEdit,
  onDelete,
}: {
  row: AthleteRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const fullName = `${row.firstName} ${row.lastName}`;
  const clubLabel = row.club
    ? clubSigla(row.club.shortName, row.club.name)
    : "—";
  const clubTitle = row.club?.name;

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[auto_1fr_7rem_5.5rem_auto] sm:gap-4 sm:items-center sm:px-4">
      <Thumb src={row.photoUrl} alt={fullName} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground leading-snug">
          {fullName}
          {row.shirtNumber != null ? (
            <span className="text-muted-foreground font-normal"> · #{row.shirtNumber}</span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5 sm:max-w-none" title={clubTitle}>
          {clubLabel}
        </p>
        <p className="text-xs text-muted-foreground mt-1 sm:hidden">
          {PLAYER_POSITION_LABELS[row.position] ?? row.position}
        </p>
      </div>
      <p className="hidden sm:block text-sm text-muted-foreground text-right">
        {PLAYER_POSITION_LABELS[row.position] ?? row.position}
      </p>
      <div className="shrink-0 sm:justify-self-start">
        <StatusBadge status={row.status} label={ATHLETE_STATUS_LABELS[row.status] ?? row.status} />
      </div>
      <div className="flex shrink-0 gap-0.5 sm:justify-self-end">
        <Button type="button" variant="ghost" size="sm" onClick={onEdit} aria-label={`Editar ${fullName}`}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDelete} aria-label={`Excluir ${fullName}`}>
          <Trash2 className="h-4 w-4 text-red-400" />
        </Button>
      </div>
    </div>
  );
}

export function AdminAthletesPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<AthleteRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AthleteRow | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/crud/athletes?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = await parseApiResponse<{ items: AthleteRow[]; total: number }>(res);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
      toast({ title: "Erro ao carregar atletas", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, q, toast]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const groups = useMemo(() => groupAthletesByCategory(items.map(rowToSquad)), [items]);

  const rowById = useMemo(() => new Map(items.map((r) => [r.id, r])), [items]);

  const visibleGroups = useMemo(() => {
    if (activeCategory === "all") return groups;
    return groups.filter((g) => g.category === activeCategory);
  }, [groups, activeCategory]);

  async function handleDelete(row: AthleteRow) {
    if (!confirm(`Excluir ${row.firstName} ${row.lastName}? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/admin/crud/athletes/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error || "Falha ao excluir");
      }
      toast({ title: "Atleta excluído", variant: "success" });
      await load();
    } catch (e) {
      toast({
        title: "Erro ao excluir",
        description: e instanceof Error ? e.message : "Falha ao excluir",
        variant: "error",
      });
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Atletas"
        description="Elenco, fotos, posições e vínculo com clubes."
        onNew={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
      />

      <div className="glass-card p-4 mb-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-1 min-w-[200px] gap-2">
            <Input
              placeholder="Buscar atleta..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setPage(1), void load())}
              className="min-w-[180px] flex-1"
            />
            <Button variant="outline" onClick={() => (setPage(1), void load())}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            Página {page} de {totalPages} · {total} registros
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>

        {groups.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por categoria">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              className={cn(categoryPillBase, "px-3 py-1.5 text-xs", activeCategory === "all" && categoryPillActive)}
            >
              Todas ({items.length})
            </button>
            {groups.map((g) => (
              <button
                key={g.category}
                type="button"
                role="tab"
                aria-selected={activeCategory === g.category}
                onClick={() => setActiveCategory(g.category)}
                className={cn(
                  categoryPillBase,
                  "px-3 py-1.5 text-xs",
                  activeCategory === g.category && categoryPillActive
                )}
              >
                {g.category} ({g.athletes.length})
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">
          Nenhum atleta encontrado.
        </div>
      ) : (
        <div className="space-y-6">
          {visibleGroups.map((group) => (
            <section key={group.category} aria-labelledby={`admin-athletes-${group.category}`}>
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-line pb-2">
                <h2
                  id={`admin-athletes-${group.category}`}
                  className="flex items-center gap-2 font-display text-lg sm:text-xl tracking-wide text-foreground"
                >
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                  {group.category}
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {group.athletes.length} {group.athletes.length === 1 ? "atleta" : "atletas"}
                </span>
              </div>

              <div className="glass-card overflow-hidden divide-y divide-line/50">
                {/* Cabeçalho só no desktop */}
                <div className="hidden sm:grid sm:grid-cols-[auto_1fr_7rem_5.5rem_auto] sm:gap-4 sm:items-center px-4 py-2 bg-secondary/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span className="w-10" />
                  <span>Atleta / Clube</span>
                  <span className="text-right">Posição</span>
                  <span>Status</span>
                  <span className="text-right w-[4.5rem]">Ações</span>
                </div>

                {group.athletes.map((a) => {
                  const row = rowById.get(a.id);
                  if (!row) return null;
                  return (
                    <AthleteListRow
                      key={row.id}
                      row={row}
                      onEdit={() => {
                        setEditing(row);
                        setDialogOpen(true);
                      }}
                      onDelete={() => void handleDelete(row)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          title={editing ? "Editar atleta" : "Novo atleta"}
          description={`Preencha os campos para ${editing ? "atualizar" : "cadastrar"}.`}
          className="max-w-3xl"
        >
          <AthleteForm
            key={editing?.id ?? "new"}
            initial={(editing as Record<string, unknown>) ?? null}
            onSuccess={() => {
              setDialogOpen(false);
              setEditing(null);
              void load();
              toast({
                title: editing ? "Atleta atualizado" : "Atleta criado",
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
