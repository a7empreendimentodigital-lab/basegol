"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import type { EntityFormProps } from "@/components/crud/EntityPage";
import type { ListGroup } from "@/lib/admin-list-groups";
import { parseApiResponse } from "@/lib/api-client";
import { categoryPillActive, categoryPillBase } from "@/lib/public-ui-classes";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE = 100;

type Props<T extends { id: string }> = {
  entity: string;
  /** Ex.: `/api/admin/users` — quando omitido, usa `/api/admin/crud/{entity}` */
  apiBase?: string;
  title: string;
  description?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  pageSize?: number;
  extraParams?: Record<string, string | undefined>;
  toolbarExtras?: ReactNode;
  filterAriaLabel?: string;
  FormComponent: React.ComponentType<EntityFormProps>;
  dialogTitles?: { new: string; edit: string };
  deleteConfirm?: (row: T) => string;
  buildGroups: (items: T[]) => ListGroup<T>[];
  renderRow: (props: { row: T; onEdit: () => void; onDelete: () => void }) => ReactNode;
  renderDesktopHeader?: () => ReactNode;
  sectionIcon?: LucideIcon;
  countLabel?: (count: number) => string;
  pillAllLabel?: string;
  canCreate?: boolean;
};

export function AdminGroupedListPage<T extends { id: string }>({
  entity,
  apiBase,
  title,
  description,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum registro encontrado.",
  pageSize = DEFAULT_PAGE_SIZE,
  extraParams,
  toolbarExtras,
  filterAriaLabel = "Filtrar lista",
  FormComponent,
  dialogTitles = { new: "Novo registro", edit: "Editar registro" },
  deleteConfirm = () => "Excluir este registro? Esta ação não pode ser desfeita.",
  buildGroups,
  renderRow,
  renderDesktopHeader,
  sectionIcon: SectionIcon,
  countLabel = (n) => `${n} ${n === 1 ? "registro" : "registros"}`,
  pillAllLabel = "Todos",
  canCreate = true,
}: Props<T>) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | "all">("all");

  const extraParamsKey = useMemo(() => JSON.stringify(extraParams ?? {}), [extraParams]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const listBase = apiBase ?? `/api/admin/crud/${entity}`;
  const deleteBase = apiBase ?? `/api/admin/crud/${entity}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (q.trim()) params.set("q", q.trim());
      for (const [key, value] of Object.entries(extraParams ?? {})) {
        if (value) params.set(key, value);
      }
      const res = await fetch(`${listBase}?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = await parseApiResponse<{ items: T[]; total: number }>(res);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
      toast({ title: "Erro ao carregar dados", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [listBase, page, pageSize, q, extraParamsKey, toast]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [q, extraParamsKey]);

  useEffect(() => {
    setActiveGroup("all");
  }, [q, extraParamsKey]);

  const groups = useMemo(() => buildGroups(items), [items, buildGroups]);

  const visibleGroups = useMemo(() => {
    if (activeGroup === "all") return groups;
    return groups.filter((g) => g.key === activeGroup);
  }, [groups, activeGroup]);

  async function handleDelete(row: T) {
    const ok = await confirm({
      title: "Excluir registro?",
      description: deleteConfirm(row),
      confirmLabel: "Excluir",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      const res = await fetch(`${deleteBase}/${row.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error || "Falha ao excluir");
      }
      toast({ title: "Registro excluído", variant: "success" });
      await load();
    } catch (e) {
      toast({
        title: "Erro ao excluir",
        description: e instanceof Error ? e.message : "Falha ao excluir",
        variant: "error",
      });
    }
  }

  const sectionSlug = entity.replace(/_/g, "-");

  return (
    <div>
      <AdminPageHeader
        title={title}
        description={description}
        onNew={
          canCreate
            ? () => {
                setEditing(null);
                setDialogOpen(true);
              }
            : undefined
        }
      />

      <div className="glass-card p-4 mb-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex flex-1 min-w-[200px] gap-2 flex-wrap">
            {toolbarExtras}
            <Input
              placeholder={searchPlaceholder}
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
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={filterAriaLabel}>
            <button
              type="button"
              role="tab"
              aria-selected={activeGroup === "all"}
              onClick={() => setActiveGroup("all")}
              className={cn(categoryPillBase, "px-3 py-1.5 text-xs", activeGroup === "all" && categoryPillActive)}
            >
              {pillAllLabel} ({items.length})
            </button>
            {groups.map((g) => (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={activeGroup === g.key}
                onClick={() => setActiveGroup(g.key)}
                className={cn(
                  categoryPillBase,
                  "px-3 py-1.5 text-xs",
                  activeGroup === g.key && categoryPillActive
                )}
              >
                {g.label} ({g.items.length})
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
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">{emptyMessage}</div>
      ) : (
        <div className="space-y-6">
          {visibleGroups.map((group) => (
            <section key={group.key} aria-labelledby={`admin-${sectionSlug}-${group.key}`}>
              <div className="mb-2 flex items-center justify-between gap-2 border-b border-line pb-2">
                <h2
                  id={`admin-${sectionSlug}-${group.key}`}
                  className="flex items-center gap-2 font-display text-lg sm:text-xl tracking-wide text-foreground"
                >
                  {SectionIcon ? (
                    <SectionIcon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                  ) : null}
                  {group.label}
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {countLabel(group.items.length)}
                </span>
              </div>

              <div className="glass-card overflow-hidden divide-y divide-line/50">
                {renderDesktopHeader?.()}
                {group.items.map((row) => (
                  <div key={row.id}>
                    {renderRow({
                      row,
                      onEdit: () => {
                        setEditing(row);
                        setDialogOpen(true);
                      },
                      onDelete: () => void handleDelete(row),
                    })}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          title={editing ? dialogTitles.edit : dialogTitles.new}
          description={`Preencha os campos para ${editing ? "atualizar" : "cadastrar"}.`}
          className="max-w-3xl"
        >
          <FormComponent
            key={editing?.id ?? "new"}
            initial={(editing as Record<string, unknown>) ?? null}
            onSuccess={() => {
              setDialogOpen(false);
              setEditing(null);
              void load();
              toast({
                title: editing ? "Atualizado com sucesso" : "Criado com sucesso",
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
