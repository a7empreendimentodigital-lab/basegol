"use client";

import { useAdminFormFeedback } from "@/components/admin/forms/admin-form-feedback";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/admin/forms/FormField";
import { menuItemSchema } from "@/utils/zod-schemas/admin-entities";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { type AdminFormProps, bool, str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof menuItemSchema>;

export function MenuForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
    const { onSaveError } = useAdminFormFeedback();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      label: str(initial?.label),
      href: str(initial?.href, "/"),
      icon: str(initial?.icon),
      area: str(initial?.area, "PUBLIC"),
      order: Number(initial?.order ?? 0),
      isActive: bool(initial?.isActive, true),
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitEntity("menu_items", data, id || undefined);
          onSuccess();
        } catch (e) {
          onSaveError(e);
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Rótulo" error={errors.label?.message}>
        <Input {...register("label")} />
      </FormField>
      <FormField label="Link" error={errors.href?.message}>
        <Input {...register("href")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Ícone (nome Lucide)">
          <Input {...register("icon")} placeholder="Trophy" />
        </FormField>
        <FormField label="Área">
          <Select {...register("area")}>
            <option value="PUBLIC">Público</option>
            <option value="ADMIN">Admin</option>
            <option value="CLUBE">Clube</option>
          </Select>
        </FormField>
        <FormField label="Ordem">
          <Input type="number" {...register("order")} />
        </FormField>
        <FormField label="Ativo">
          <Switch checked={watch("isActive")} onCheckedChange={(v) => setValue("isActive", v)} />
        </FormField>
      </div>
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
