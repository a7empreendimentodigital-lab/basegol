"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { parseApiResponse } from "@/lib/api-client";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  status: string;
  role: string;
  assignedMatchIds: string[];
};

export function ChampionshipUsersAdmin({
  championshipId,
  actorRole,
}: {
  championshipId: string;
  actorRole: string;
}) {
  const { toast } = useToast();
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleSlug: "OPERADOR_DE_PARTIDA" as "OPERADOR_DE_PARTIDA" | "ADMIN_CAMPEONATO",
  });

  const canCreateAdmin = actorRole === "SUPER_ADMIN" || actorRole === "ADMIN_LIGA";
  const base = `/api/admin/championships/${championshipId}/members`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(base, { cache: "no-store" });
      const data = await parseApiResponse<{ items: UserRow[] }>(res);
      setItems(data?.items ?? []);
    } catch {
      toast({ title: "Erro ao carregar usuários", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [base, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          status: "ACTIVE",
          assignedMatchIds: [],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Erro ao criar");
      }
      toast({
        title: "Usuário criado. Senha provisória — troca no primeiro acesso.",
        variant: "success",
      });
      setOpen(false);
      setForm({
        name: "",
        email: "",
        password: "",
        roleSlug: "OPERADOR_DE_PARTIDA",
      });
      await load();
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Erro ao criar usuário",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Usuários do campeonato"
        description="Operadores com acesso ao placar ao vivo das partidas liberadas. Admins do campeonato só podem ser criados pelo super admin."
        onNew={() => setOpen(true)}
        newLabel="Novo usuário"
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-line/60 bg-graphite/30 px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum usuário vinculado a este campeonato.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {items.map((u) => (
            <li key={u.id} className="px-4 py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{u.name ?? u.email}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {u.role === "ADMIN_CAMPEONATO" ? "Admin do campeonato" : "Operador"}
                {u.role === "OPERADOR_DE_PARTIDA" && u.assignedMatchIds.length > 0
                  ? ` · ${u.assignedMatchIds.length} jogo(s)`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" title="Novo usuário">
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <Label>Senha provisória</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="cu-role">Papel</Label>
              <Select
                id="cu-role"
                value={form.roleSlug}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    roleSlug: e.target.value as "OPERADOR_DE_PARTIDA" | "ADMIN_CAMPEONATO",
                  }))
                }
              >
                <option value="OPERADOR_DE_PARTIDA">Operador de partida</option>
                {canCreateAdmin ? (
                  <option value="ADMIN_CAMPEONATO">Admin do campeonato</option>
                ) : null}
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Após criar um operador, atribua as partidas em Admin → Usuários ou na ficha do jogo.
            </p>
            <Button
              type="button"
              disabled={saving || !form.name || !form.email || form.password.length < 8}
              onClick={() => void handleCreate()}
            >
              {saving ? "Criando…" : "Criar usuário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
