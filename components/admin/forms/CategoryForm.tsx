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
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { categorySchema } from "@/utils/zod-schemas/admin-entities";
import { CATEGORY_STATUS_LABELS } from "@/lib/admin-labels";
import { relationIdFromInitial } from "@/lib/admin-form-relations";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { useAdminOptions } from "@/hooks/use-admin-options";
import { type AdminFormProps, str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof categorySchema>;

function buildDefaults(initial?: Record<string, unknown> | null): FormData {
  return {
    championshipId: relationIdFromInitial(initial, "championshipId", "championship"),
    name: str(initial?.name),
    ageGroup: str(initial?.ageGroup),
    minAge: initial?.minAge != null ? Number(initial.minAge) : null,
    maxAge: initial?.maxAge != null ? Number(initial.maxAge) : null,
    gender: str(initial?.gender, "M"),
    status: (str(initial?.status, "ACTIVE") as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
    imageUrl: (initial?.imageUrl as string | null) ?? null,
  };
}

export function CategoryForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
  const { options: championships, loading: championshipsLoading } = useAdminOptions("championships");
  const [saving, setSaving] = useState(false);

  const defaultValues = useMemo(() => buildDefaults(initial), [initial?.id, initial]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  const getValuesForReset = useCallback(() => buildDefaults(initial), [initial]);

  const championshipId = watch("championshipId") ?? "";

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitEntity("categories", data, id || undefined);
          onSuccess();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Erro");
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Campeonato" error={errors.championshipId?.message}>
        <AdminRelationSelect
          name="championshipId"
          value={championshipId}
          options={championships}
          optionsLoading={championshipsLoading}
          setValue={setValue}
          reset={reset}
          syncWhenReady={!!id}
          getValuesForReset={getValuesForReset}
          placeholder="Selecione o campeonato..."
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome da categoria" error={errors.name?.message}>
          <Input {...register("name")} placeholder="Sub-15" />
        </FormField>
        <FormField label="Faixa etária">
          <Input {...register("ageGroup")} placeholder="Sub-15" />
        </FormField>
        <FormField label="Idade mínima">
          <Input type="number" {...register("minAge")} />
        </FormField>
        <FormField label="Idade máxima">
          <Input type="number" {...register("maxAge")} />
        </FormField>
        <FormField label="Status">
          <Select {...register("status")}>
            {Object.entries(CATEGORY_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Gênero">
          <Select {...register("gender")}>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="Misto">Misto</option>
          </Select>
        </FormField>
      </div>
      <ImageUpload
        label="Imagem da categoria"
        category="category"
        value={watch("imageUrl") || null}
        onChange={(v) => setValue("imageUrl", v)}
      />
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