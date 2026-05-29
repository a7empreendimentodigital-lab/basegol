"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/admin/forms/FormField";
import { userCreateSchema, userUpdateSchema } from "@/utils/zod-schemas/user.schemas";
import { useAdminOptions } from "@/hooks/use-admin-options";
import { ROLE_LABELS } from "@/lib/admin-labels";
import { ADMIN_CREATABLE_ROLE_SLUGS, ROLE_SECTOR_INFO } from "@/lib/role-access";
import type { EntityFormProps } from "@/components/crud/EntityPage";
import { str } from "@/components/admin/forms/types";
import { cn } from "@/lib/utils";

export function UserForm({ initial, onSuccess, onCancel }: EntityFormProps) {
  const id = str(initial?.id);
  const isEdit = !!id;
  const { options: clubs } = useAdminOptions("clubs");
  const { options: matches } = useAdminOptions("matches");
  const [saving, setSaving] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState<string[]>(
    Array.isArray(initial?.assignedMatchIds) ? (initial.assignedMatchIds as string[]) : []
  );

  const schema = isEdit ? userUpdateSchema : userCreateSchema;
  type FormData = z.infer<typeof userCreateSchema>;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: str(initial?.name),
      email: str(initial?.email),
      password: "",
      roleSlug: (str(initial?.role, "CLUBE") as FormData["roleSlug"]) ?? "CLUBE",
      status: (str(initial?.status, "ACTIVE") as FormData["status"]) ?? "ACTIVE",
      clubId: (initial?.clubId as string | null) ?? "",
    },
  });

  const roleSlug = watch("roleSlug");

  const sectorInfo = useMemo(() => {
    const key = roleSlug as keyof typeof ROLE_SECTOR_INFO;
    return ROLE_SECTOR_INFO[key];
  }, [roleSlug]);

  useEffect(() => {
    if (!isEdit) setSelectedMatches([]);
  }, [roleSlug, isEdit]);

  function toggleMatch(matchId: string) {
    setSelectedMatches((prev) =>
      prev.includes(matchId) ? prev.filter((m) => m !== matchId) : [...prev, matchId]
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          const payload: Record<string, unknown> = { ...data };
          if (data.clubId === "") payload.clubId = null;
          if (isEdit && !payload.password) delete payload.password;
          if (roleSlug === "OPERADOR_DE_PARTIDA") {
            payload.assignedMatchIds = selectedMatches;
          } else {
            payload.assignedMatchIds = [];
          }

          const url = id ? `/api/admin/users/${id}` : "/api/admin/users";
          const res = await fetch(url, {
            method: id ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const json = await res.json();
          if (!res.ok || json.ok === false) throw new Error(json.error || "Erro");
          onSuccess();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Erro");
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      {sectorInfo && (
        <div className="rounded-xl border border-line bg-pitch/40 px-3 py-2.5 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{sectorInfo.label}</p>
          <p className="mt-1">{sectorInfo.description}</p>
          <p className="mt-1">
            Após o login:{" "}
            <span className="font-mono text-foreground">{sectorInfo.loginPath}</span>
          </p>
        </div>
      )}

      <FormField label="Nome" error={errors.name?.message}>
        <Input {...register("name")} />
      </FormField>
      <FormField label="E-mail" error={errors.email?.message}>
        <Input type="email" {...register("email")} />
      </FormField>
      <FormField label={isEdit ? "Nova senha (opcional)" : "Senha"} error={errors.password?.message}>
        <Input type="password" {...register("password")} autoComplete="new-password" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Setor (papel)" error={errors.roleSlug?.message}>
          <Select {...register("roleSlug")}>
            {ADMIN_CREATABLE_ROLE_SLUGS.map((k) => (
              <option key={k} value={k}>
                {ROLE_LABELS[k] ?? k}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select {...register("status")}>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="PENDING">Pendente</option>
            <option value="BANNED">Bloqueado</option>
          </Select>
        </FormField>
      </div>

      {roleSlug === "CLUBE" && (
        <FormField label="Clube vinculado" error={errors.clubId?.message}>
          <Select {...register("clubId")}>
            <option value="">Selecione o clube</option>
            {clubs.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      {roleSlug === "OPERADOR_DE_PARTIDA" && (
        <FormField label="Partidas atribuídas">
          <p className="mb-2 text-xs text-muted-foreground">
            O operador só vê e altera o placar das partidas marcadas abaixo.
          </p>
          <div
            className={cn(
              "max-h-48 overflow-y-auto rounded-xl border border-line bg-graphite-light/50 p-2 space-y-1"
            )}
          >
            {matches.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-3">
                Cadastre jogos em Admin → Jogos antes de atribuir um operador.
              </p>
            ) : (
              matches.map((m) => (
                <label
                  key={m.value}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-graphite/60 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMatches.includes(m.value)}
                    onChange={() => toggleMatch(m.value)}
                    className="rounded border-line"
                  />
                  <span className="truncate">{m.label}</span>
                </label>
              ))
            )}
          </div>
        </FormField>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          Salvar
        </Button>
      </div>
    </form>
  );
}
