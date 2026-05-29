"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseApiResponse } from "@/lib/api-client";
import { ADMIN_CRUD_TEMPLATES, ADMIN_FIELD_HINTS } from "@/lib/admin-crud-templates";
import { DEFAULT_PAGE_SIZE } from "@/utils/pagination";

type Props = {
  entity: string;
  title: string;
  searchableFieldHint?: string;
};

type ListPayload = {
  items: Record<string, unknown>[];
  total: number;
};

export function AdminCrudPage({ entity, title, searchableFieldHint }: Props) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [newJson, setNewJson] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pageSize = DEFAULT_PAGE_SIZE;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const defaultTemplate = ADMIN_CRUD_TEMPLATES[entity] ?? "{\n  \n}";
  const fieldHint = ADMIN_FIELD_HINTS[entity];

  useEffect(() => {
    setNewJson(defaultTemplate);
    setPage(1);
    setQ("");
    setMessage("");
    setError("");
  }, [entity, defaultTemplate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/crud/${entity}?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${res.status}`);
      }
      const data = await parseApiResponse<ListPayload>(res);
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total ?? 0));
    } catch (e) {
      setItems([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : "Falha ao carregar registros");
    } finally {
      setLoading(false);
    }
  }, [entity, page, pageSize, q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function search() {
    setPage(1);
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: "1", pageSize: String(pageSize) });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/crud/${entity}?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${res.status}`);
      }
      const data = await parseApiResponse<ListPayload>(res);
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total ?? 0));
    } catch (e) {
      setItems([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : "Falha ao buscar registros");
    } finally {
      setLoading(false);
    }
  }

  async function createItem() {
    setMessage("");
    setError("");
    try {
      const payload = JSON.parse(newJson);
      const res = await fetch(`/api/admin/crud/${entity}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${res.status}`);
      }
      await parseApiResponse(res);
      setMessage("Registro criado com sucesso.");
      setNewJson(defaultTemplate);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar registro");
    }
  }

  async function deleteItem(id: string) {
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/crud/${entity}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${res.status}`);
      }
      setMessage("Registro excluído.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao excluir registro");
    }
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-neon">{title}</h1>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-neon">{message}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Busca, filtro e paginação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
              placeholder={searchableFieldHint ?? "Buscar..."}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button onClick={search} disabled={loading}>
              Buscar
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Página {page} de {totalPages} · Total: {total}
            {loading ? " · Carregando..." : ""}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Novo registro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fieldHint ? (
            <p className="text-xs text-muted-foreground">
              Campos: <span className="text-foreground">{fieldHint}</span>
            </p>
          ) : null}
          <textarea
            className="h-40 w-full rounded-lg border border-border bg-secondary p-3 text-xs font-mono"
            value={newJson}
            onChange={(e) => setNewJson(e.target.value)}
            spellCheck={false}
          />
          <div className="flex gap-2">
            <Button onClick={createItem}>Criar</Button>
            <Button variant="outline" onClick={() => setNewJson(defaultTemplate)}>
              Restaurar modelo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Tabela de registros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!loading && items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>
          ) : null}
          {items.map((item) => {
            const id = String(item.id ?? "");
            return (
              <div key={id || JSON.stringify(item)} className="rounded-lg border border-border p-3 space-y-2">
                <pre className="text-[11px] whitespace-pre-wrap break-all">{JSON.stringify(item, null, 2)}</pre>
                {id ? (
                  <Button variant="destructive" size="sm" onClick={() => deleteItem(id)}>
                    Excluir
                  </Button>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
