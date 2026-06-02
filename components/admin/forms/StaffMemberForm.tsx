"use client";

import { useAdminFormFeedback } from "@/components/admin/forms/admin-form-feedback";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { staffMemberAdminSchema } from "@/utils/zod-schemas/admin-entities";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { useAdminOptions } from "@/hooks/use-admin-options";
import { STAFF_ROLE_LABELS } from "@/lib/admin-labels";
import type { EntityFormProps } from "@/components/crud/EntityPage";
import { str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof staffMemberAdminSchema>;

export function StaffMemberForm({ initial, onSuccess, onCancel }: EntityFormProps) {
  const id = str(initial?.id);
  const { options: clubs } = useAdminOptions("clubs");
    const { onSaveError } = useAdminFormFeedback();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(staffMemberAdminSchema),
    defaultValues: {
      clubId: str(initial?.clubId),
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
          await submitEntity("staff_members", data, id || undefined);
          onSuccess();
        } catch (e) {
          onSaveError(e);
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Clube" error={errors.clubId?.message}>
        <Select {...register("clubId")}>
          <option value="">Selecione...</option>
          {clubs.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Nome" error={errors.name?.message}>
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
