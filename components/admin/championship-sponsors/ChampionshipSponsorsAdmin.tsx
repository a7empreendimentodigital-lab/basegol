"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChampionshipSponsorPlacement } from "@prisma/client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminListRowActions } from "@/components/admin/shared/AdminListRowActions";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  lastImpressionAt: string | null;
  lastClickAt: string | null;
};

type FormState = {
  name: string;
  logoUrl: string;
  linkUrl: string;
  placement: ChampionshipSponsorPlacement;
  order: string;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  logoUrl: "",
  linkUrl: "",
  placement: "SIDEBAR_RIGHT",
  order: "0",
  isActive: true,
});

function formatMetricDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function ChampionshipSponsorsAdmin({
  championshipId,
  autoOpenCreate = false,
}: {
  championshipId: string;
  autoOpenCreate?: boolean;
}) {
  const { toast } = useToast();
  const [items, setItems] = useState<SponsorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(autoOpenCreate);
  const [editing, setEditing] = useState<SponsorRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  const base = `/api/admin/championships/${championshipId}/sponsors`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(base, { cache: "no-store" });
      const data = await parseApiResponse<{ items: SponsorRow[] }>(res);
      setItems(data?.items ?? []);
    } catch {
      toast({ title: "Não foi possível carregar patrocinadores", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          a.placement.localeCompare(b.placement) ||
          a.order - b.order ||
          a.name.localeCompare(b.name)
      ),
    [items]
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(row: SponsorRow) {
    setEditing(row);
    setForm({
      name: row.name,
      logoUrl: row.logoUrl ?? "",
      linkUrl: row.linkUrl ?? "",
      placement: row.placement,
      order: String(row.order),
      isActive: row.isActive,
    });
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        logoUrl: form.logoUrl.trim() || null,
        linkUrl: form.linkUrl.trim() || null,
        placement: form.placement,
        order: Number(form.order) || 0,
        isActive: form.isActive,
      };
      const res = await fetch(editing ? `${base}/${editing.id}` : base, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Erro ao salvar");
      }
      toast({
        title: editing ? "Patrocinador atualizado" : "Patrocinador criado",
        variant: "success",
      });
      setOpen(false);
      await load();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Erro ao salvar",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: SponsorRow) {
    if (!confirm(`Excluir patrocinador "${row.name}"?`)) return;
    try {
      const res = await fetch(`${base}/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Patrocinador excluído", variant: "success" });
      await load();
    } catch {
      toast({ title: "Erro ao excluir", variant: "error" });
    }
  }

  async function toggleActive(row: SponsorRow) {
    try {
      const res = await fetch(`${base}/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      toast({ title: "Erro ao atualizar status", variant: "error" });
    }
  }

  async function reorderPlacement(placement: ChampionshipSponsorPlacement, moveId: string, dir: -1 | 1) {
    const group = sortedItems.filter((r) => r.placement === placement);
    const idx = group.findIndex((r) => r.id === moveId);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= group.length) return;

    const next = [...group];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    const orderedIds = next.map((r) => r.id);

    setReordering(true);
    try {
      const res = await fetch(`${base}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      toast({ title: "Erro ao reordenar", variant: "error" });
    } finally {
      setReordering(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Patrocinadores do campeonato"
        description="Exibidos na área pública deste campeonato (barra lateral esquerda e direita), com rotação automática. Não aparecem em outros campeonatos."
        onNew={openCreate}
        newLabel="Novo patrocinador"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-line/60 bg-graphite/30 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum patrocinador cadastrado para este campeonato.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line overflow-hidden">
          {sortedItems.map((row, _i, arr) => {
            const placementGroup = arr.filter((r) => r.placement === row.placement);
            const idxInPlacement = placementGroup.findIndex((r) => r.id === row.id);
            const ctr = sponsorCtr(row.impressionCount, row.clickCount);

            return (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 bg-graphite/20 px-4 py-3 sm:grid sm:grid-cols-[auto_1fr_7rem_5rem_auto] sm:items-center"
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
                  <p className="text-[10px] text-muted-foreground/60">
                    Última exibição: {formatMetricDate(row.lastImpressionAt)}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={reordering || idxInPlacement === 0}
                    aria-label={`Subir ${row.name}`}
                    onClick={() => void reorderPlacement(row.placement, row.id, -1)}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={reordering || idxInPlacement >= placementGroup.length - 1}
                    aria-label={`Descer ${row.name}`}
                    onClick={() => void reorderPlacement(row.placement, row.id, 1)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleActive(row)}
                  className="text-left"
                >
                  <StatusBadge
                    status={row.isActive ? "ACTIVE" : "INACTIVE"}
                    label={row.isActive ? "Ativo" : "Inativo"}
                  />
                </button>
                <AdminListRowActions
                  onEdit={() => openEdit(row)}
                  onDelete={() => void handleDelete(row)}
                  editLabel={`Editar ${row.name}`}
                  deleteLabel={`Excluir ${row.name}`}
                />
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-md"
          title={editing ? "Editar patrocinador" : "Novo patrocinador"}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="sp-name">Nome</Label>
              <Input
                id="sp-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="sp-logo">Imagem / banner (URL)</Label>
              <Input
                id="sp-logo"
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div>
              <Label htmlFor="sp-link">Link de destino (opcional)</Label>
              <Input
                id="sp-link"
                value={form.linkUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div>
              <Label htmlFor="sp-placement">Posição na área pública</Label>
              <Select
                id="sp-placement"
                value={form.placement}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    placement: e.target.value as ChampionshipSponsorPlacement,
                  }))
                }
              >
                {(
                  Object.entries(CHAMPIONSHIP_SPONSOR_PLACEMENT_LABELS) as [
                    ChampionshipSponsorPlacement,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="sp-order">Ordem de exibição</Label>
              <Input
                id="sp-order"
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: c }))}
              />
              <Label>Ativo</Label>
            </div>
            <Button type="button" disabled={saving || !form.name.trim()} onClick={() => void handleSave()}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
