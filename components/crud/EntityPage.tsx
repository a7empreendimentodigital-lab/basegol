"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminDataTable, type AdminColumn } from "@/components/admin/shared/AdminDataTable";
import { parseApiResponse } from "@/lib/api-client";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toaster";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

type ListPayload<T> = { items: T[]; total: number };

export type EntityFormProps = {
  initial?: Record<string, unknown> | null;
  onSuccess: () => void;
  onCancel: () => void;
};

type Props<T extends { id: string }> = {
  apiBase: string;
  entity: string;
  title: string;
  description?: string;
  columns: AdminColumn<T>[];
  searchPlaceholder?: string;
  backHref?: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  pageSize?: number;
  extraParams?: Record<string, string | undefined>;
  toolbarExtras?: React.ReactNode;
  FormComponent: React.ComponentType<EntityFormProps>;
};

export function EntityPage<T extends { id: string }>({
  apiBase,
  entity,
  title,
  description,
  columns,
  searchPlaceholder = "Buscar...",
  backHref,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  pageSize = DEFAULT_PAGE_SIZE,
  extraParams,
  toolbarExtras,
  FormComponent,
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
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const extraParamsKey = useMemo(() => JSON.stringify(extraParams ?? {}), [extraParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (q.trim()) params.set("q", q.trim());
      for (const [key, value] of Object.entries(extraParams ?? {})) {
        if (value) params.set(key, value);
      }
      const base = entity ? `${apiBase}/${entity}` : apiBase;
      const res = await fetch(`${base}?${params}`);
      if (!res.ok) throw new Error("Falha ao carregar");
      const data = await parseApiResponse<ListPayload<T>>(res);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setItems([]);
      setTotal(0);
      toast({ title: "Erro ao carregar dados", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [apiBase, entity, page, pageSize, q, extraParamsKey, toast]);

  useEffect(() => {
    setPage(1);
  }, [extraParamsKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row: T) {
    setEditing(row);
    setDialogOpen(true);
  }

  async function handleDelete(row: T) {
    const ok = await confirm({
      title: "Excluir registro?",
      description: "Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      const base = entity ? `${apiBase}/${entity}` : apiBase;
      const res = await fetch(`${base}/${row.id}`, { method: "DELETE" });
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

  return (
    <div>
      {backHref ? (
        <Link href={backHref} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-neon mb-4">
          <ArrowLeft className="h-3 w-3" />
          Voltar
        </Link>
      ) : null}
      <AdminPageHeader title={title} description={description} onNew={canCreate ? openNew : undefined} />

      <div className="glass-card p-4 mb-4 flex flex-wrap gap-3 items-center">
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
        <span className="text-xs text-muted-foreground">
          Página {page} de {totalPages} · {total} registros
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </Button>
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={items}
        loading={loading}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          title={editing ? "Editar registro" : "Novo registro"}
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
              toast({ title: editing ? "Atualizado com sucesso" : "Criado com sucesso", variant: "success" });
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
