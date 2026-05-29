"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/admin/forms/FormField";
import { themeConfigSchema } from "@/utils/zod-schemas/admin-entities";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { type AdminFormProps, bool, str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof themeConfigSchema>;

export function ThemeForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(themeConfigSchema),
    defaultValues: {
      name: str(initial?.name, "Tema BaseGol"),
      isActive: bool(initial?.isActive),
      primaryColor: str(initial?.primaryColor, "#39ff14"),
      secondaryColor: str(initial?.secondaryColor, "#00c853"),
      backgroundColor: str(initial?.backgroundColor, "#050505"),
      cardColor: str(initial?.cardColor, "#0f0f13"),
      textPrimary: str(initial?.textPrimary, "#ffffff"),
      textSecondary: str(initial?.textSecondary, "#9ca3af"),
      borderColor: str(initial?.borderColor, "rgba(57,255,20,0.15)"),
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitEntity("theme_configs", data, id || undefined);
          onSuccess();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Erro");
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Nome do tema" error={errors.name?.message}>
        <Input {...register("name")} />
      </FormField>
      <FormField label="Tema ativo no site">
        <Switch checked={watch("isActive")} onCheckedChange={(v) => setValue("isActive", v)} />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["primaryColor", "Cor primária (neon)"],
            ["secondaryColor", "Cor secundária"],
            ["backgroundColor", "Fundo"],
            ["cardColor", "Cards"],
            ["textPrimary", "Texto principal"],
            ["textSecondary", "Texto secundário"],
            ["borderColor", "Bordas"],
          ] as const
        ).map(([key, label]) => (
          <FormField key={key} label={label}>
            <div className="flex gap-2">
              <Input type="color" className="w-14 h-10 p-1" {...register(key)} />
              <Input {...register(key)} />
            </div>
          </FormField>
        ))}
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
