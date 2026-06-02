"use client";

import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/admin/forms/FormField";
import { AdminRelationSelect } from "@/components/admin/forms/AdminRelationSelect";
import { groupSchema } from "@/utils/zod-schemas/admin-entities";
import { GROUP_STATUS_LABELS } from "@/lib/admin-labels";
import { relationIdFromInitial } from "@/lib/admin-form-relations";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { notifySaveError, notifySaveSuccess } from "@/components/admin/forms/admin-form-feedback";
import { useToast } from "@/components/ui/toaster";
import { useAdminOptions } from "@/hooks/use-admin-options";
import { type AdminFormProps, str } from "@/components/admin/forms/types";
import { GroupTeamsField } from "@/components/admin/forms/GroupTeamsField";

type FormData = z.infer<typeof groupSchema>;

function buildDefaults(initial?: Record<string, unknown> | null): FormData {
  return {
    categoryId: relationIdFromInitial(initial, "categoryId", "category"),
    name: str(initial?.name),
    status: (str(initial?.status, "ACTIVE") as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
  };
}

export function GroupForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
  const { toast } = useToast();
  const { options: categories, loading: categoriesLoading } = useAdminOptions("categories");
  const [saving, setSaving] = useState(false);

  const defaultValues = useMemo(() => buildDefaults(initial), [initial]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(groupSchema),
    defaultValues,
  });

  const getValuesForReset = useCallback(() => buildDefaults(initial), [initial]);
  const categoryId = watch("categoryId") ?? "";

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitEntity("groups", data, id || undefined);
          notifySaveSuccess(toast, id ? "Grupo atualizado" : "Grupo criado");
          onSuccess();
        } catch (e) {
          notifySaveError(toast, e);
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Categoria" error={errors.categoryId?.message}>
        <AdminRelationSelect
          name="categoryId"
          value={categoryId}
          options={categories}
          optionsLoading={categoriesLoading}
          setValue={setValue}
          reset={reset}
          syncWhenReady={!!id}
          getValuesForReset={getValuesForReset}
          placeholder="Selecione a categoria..."
        />
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
