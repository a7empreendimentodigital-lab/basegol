"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { parseApiResponse } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { ROLE_LABELS } from "@/lib/admin-labels";

type RoleRow = {
  id: string;
  slug: string;
  name: string;
  userCount: number;
  permissions: string[];
};

const ALL_PERMISSIONS = [
  "championship:*",
  "club:*",
  "match:*",
  "news:*",
  "athlete:read",
  "document:read",
  "user:read",
  "club:own:*",
  "athlete:own:*",
  "staff:own:*",
  "document:own:*",
  "match:update-live",
  "public:read",
  "*",
];

export default function AdminPermissoesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [selected, setSelected] = useState<RoleRow | null>(null);
  const [draft, setDraft] = useState<string[]>([]);

  useEffect(() => {
    void fetch("/api/admin/roles")
      .then(async (r) => (r.ok ? parseApiResponse<RoleRow[]>(r) : []))
      .then((data) => setRoles(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (selected) setDraft(selected.permissions);
  }, [selected]);

  async function save() {
    if (!selected) return;
    const res = await fetch(`/api/admin/roles/${selected.id}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionCodes: draft }),
    });
    if (res.ok) {
      toast({ title: "Permissões salvas", variant: "success" });
      setSelected({ ...selected, permissions: draft });
    } else {
      toast({ title: "Erro ao salvar", variant: "error" });
    }
  }

  return (
    <div className="max-w-6xl">
      <AdminPageHeader
        title="Permissões por papel"
        description="Defina o que cada perfil pode fazer no sistema."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-4 space-y-2">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                selected?.id === r.id ? "border-line bg-selected/20" : "border-line hover:bg-secondary"
              }`}
            >
              <p className="font-medium">{ROLE_LABELS[r.slug] ?? r.name}</p>
              <p className="text-xs text-muted-foreground">
                {r.userCount} usuários · {r.permissions.length} permissões
              </p>
            </button>
          ))}
        </div>
        <div className="glass-card p-4">
          {selected ? (
            <>
              <p className="font-semibold text-neon mb-4">{ROLE_LABELS[selected.slug] ?? selected.name}</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {ALL_PERMISSIONS.map((code) => (
                  <label key={code} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.includes(code)}
                      onChange={(e) => {
                        setDraft((prev) =>
                          e.target.checked ? [...prev, code] : prev.filter((p) => p !== code)
                        );
                      }}
                    />
                    <span>{code}</span>
                  </label>
                ))}
              </div>
              <Button className="mt-4" onClick={save}>
                Salvar permissões
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Selecione um papel à esquerda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
