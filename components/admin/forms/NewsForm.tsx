"use client";

import { useAdminFormFeedback } from "@/components/admin/forms/admin-form-feedback";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { newsSchema } from "@/utils/zod-schemas/admin-entities";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { useAdminOptions } from "@/hooks/use-admin-options";
import { type AdminFormProps, bool, str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof newsSchema>;

export function NewsForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
  const { options: championships } = useAdminOptions("championships");
    const { onSaveError } = useAdminFormFeedback();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: str(initial?.title),
      summary: str(initial?.summary),
      content: str(initial?.content),
      category: str(initial?.category, "Campeonato"),
      isFeatured: bool(initial?.isFeatured),
      imageUrl: (initial?.imageUrl as string | null) ?? null,
      championshipId: (initial?.championshipId as string | null) ?? null,
      publishedAt: initial?.publishedAt ? String(initial.publishedAt).slice(0, 16) : "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitEntity("news", data, id || undefined);
          onSuccess();
        } catch (e) {
          onSaveError(e);
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Título" error={errors.title?.message}>
        <Input {...register("title")} />
      </FormField>
      <FormField label="Resumo">
        <Textarea {...register("summary")} rows={2} />
      </FormField>
      <FormField label="Conteúdo" error={errors.content?.message}>
        <Textarea {...register("content")} rows={6} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Categoria">
          <Input {...register("category")} />
        </FormField>
        <FormField label="Campeonato">
          <Select {...register("championshipId")}>
            <option value="">Nenhum</option>
            {championships.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Publicar em">
          <Input type="datetime-local" {...register("publishedAt")} />
        </FormField>
        <FormField label="Destaque na home">
          <div className="pt-2">
            <Switch checked={watch("isFeatured")} onCheckedChange={(v) => setValue("isFeatured", v)} />
          </div>
        </FormField>
      </div>
      <ImageUpload label="Imagem da notícia" category="news" value={watch("imageUrl")} onChange={(v) => setValue("imageUrl", v)} />
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
