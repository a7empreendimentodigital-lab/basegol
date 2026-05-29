"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/admin/forms/FormField";
import { siteTextSchema } from "@/utils/zod-schemas/admin-entities";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { type AdminFormProps, str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof siteTextSchema>;

export function SiteTextForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(siteTextSchema),
    defaultValues: {
      key: str(initial?.key),
      value: str(initial?.value),
      locale: str(initial?.locale, "pt-BR"),
      context: str(initial?.context),
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitEntity("site_texts", data, id || undefined);
          onSuccess();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Erro");
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Chave (identificador)" error={errors.key?.message}>
        <Input {...register("key")} placeholder="home.hero.title" disabled={!!initial} />
      </FormField>
      <FormField label="Texto exibido" error={errors.value?.message}>
        <Textarea {...register("value")} rows={4} />
      </FormField>
      <FormField label="Contexto">
        <Input {...register("context")} placeholder="home, footer, login..." />
      </FormField>
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
