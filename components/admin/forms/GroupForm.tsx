"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/admin/forms/FormField";
import { groupSchema } from "@/utils/zod-schemas/admin-entities";
import { GROUP_STATUS_LABELS } from "@/lib/admin-labels";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { useAdminOptions } from "@/hooks/use-admin-options";
import { type AdminFormProps, str } from "@/components/admin/forms/types";
import { GroupTeamsField } from "@/components/admin/forms/GroupTeamsField";

type FormData = z.infer<typeof groupSchema>;

export function GroupForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
  const { options: categories } = useAdminOptions("categories");
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      categoryId: str(initial?.categoryId),
      name: str(initial?.name),
      status: (str(initial?.status, "ACTIVE") as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitEntity("groups", data, id || undefined);
          onSuccess();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Erro");
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Categoria" error={errors.categoryId?.message}>
        <Select {...register("categoryId")}>
          <option value="">Selecione...</option>
          {categories.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Nome do grupo" error={errors.name?.message}>
        <Input {...register("name")} placeholder="Grupo A" />
      </FormField>
      <FormField label="Status">
        <Select {...register("status")}>
          {Object.entries(GROUP_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </FormField>

      {id ? <GroupTeamsField groupId={id} /> : null}

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
