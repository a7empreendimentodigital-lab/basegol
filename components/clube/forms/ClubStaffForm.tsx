"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { staffMemberSchema } from "@/utils/zod-schemas/club-portal.schemas";
import { submitClubEntity } from "@/components/clube/forms/submit-club-entity";
import { STAFF_ROLE_LABELS } from "@/lib/admin-labels";
import type { EntityFormProps } from "@/components/crud/EntityPage";
import { str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof staffMemberSchema>;

export function ClubStaffForm({ initial, onSuccess, onCancel }: EntityFormProps) {
  const id = str(initial?.id);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(staffMemberSchema),
    defaultValues: {
      name: str(initial?.name),
      role: (str(initial?.role, "HEAD_COACH") as FormData["role"]) ?? "HEAD_COACH",
      phone: str(initial?.phone),
      email: str(initial?.email),
      license: str(initial?.license),
      status: (str(initial?.status, "ACTIVE") as FormData["status"]) ?? "ACTIVE",
      photoUrl: (initial?.photoUrl as string | null) ?? null,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitClubEntity("staff", data, id || undefined);
          onSuccess();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Erro");
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Nome completo" error={errors.name?.message}>
        <Input {...register("name")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Função">
          <Select {...register("role")}>
            {Object.entries(STAFF_ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select {...register("status")}>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
          </Select>
        </FormField>
        <FormField label="Telefone">
          <Input {...register("phone")} />
        </FormField>
        <FormField label="E-mail">
          <Input type="email" {...register("email")} />
        </FormField>
        <FormField label="Licença / registro">
          <Input {...register("license")} />
        </FormField>
      </div>
      <ImageUpload label="Foto" category="general" value={watch("photoUrl")} onChange={(v) => setValue("photoUrl", v)} />
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
