"use client";

import { useAdminFormFeedback } from "@/components/admin/forms/admin-form-feedback";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { sponsorSchema } from "@/utils/zod-schemas/admin-entities";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { type AdminFormProps, bool, str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof sponsorSchema>;

export function SponsorForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
    const { onSaveError } = useAdminFormFeedback();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(sponsorSchema),
    defaultValues: {
      name: str(initial?.name),
      websiteUrl: str(initial?.websiteUrl),
      description: str(initial?.description),
      order: Number(initial?.order ?? 0),
      isActive: bool(initial?.isActive, true),
      logoUrl: (initial?.logoUrl as string | null) ?? null,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitEntity("sponsors", data, id || undefined);
          onSuccess();
        } catch (e) {
          onSaveError(e);
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Nome do patrocinador" error={errors.name?.message}>
        <Input {...register("name")} />
      </FormField>
      <FormField label="Site">
        <Input {...register("websiteUrl")} placeholder="https://" />
      </FormField>
      <FormField label="Descrição">
        <Textarea {...register("description")} rows={2} />
      </FormField>
      <ImageUpload label="Logo" category="sponsor" value={watch("logoUrl")} onChange={(v) => setValue("logoUrl", v)} />
      <div className="flex items-center gap-4">
        <FormField label="Ordem">
          <Input type="number" className="w-24" {...register("order")} />
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
