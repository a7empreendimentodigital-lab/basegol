"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { championshipSchema } from "@/utils/zod-schemas/admin-entities";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { CHAMPIONSHIP_STATUS_LABELS } from "@/lib/admin-labels";
import { type AdminFormProps, str } from "@/components/admin/forms/types";
import { z } from "zod";

type FormData = z.infer<typeof championshipSchema>;

export function ChampionshipForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(championshipSchema),
    defaultValues: {
      name: str(initial?.name),
      season: str(initial?.season, new Date().getFullYear().toString()),
      status: (str(initial?.status, "DRAFT") as FormData["status"]) ?? "DRAFT",
      description: str(initial?.description),
      logoUrl: (initial?.logoUrl as string | null) ?? null,
      bannerUrl: (initial?.bannerUrl as string | null) ?? null,
      startDate: initial?.startDate ? String(initial.startDate).slice(0, 10) : "",
      endDate: initial?.endDate ? String(initial.endDate).slice(0, 10) : "",
    },
  });

  const logoUrl = watch("logoUrl");
  const bannerUrl = watch("bannerUrl");

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      await submitEntity("championships", data, id || undefined);
      onSuccess();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (fieldErrors) => {
        const first = Object.values(fieldErrors)[0];
        if (first?.message) alert(String(first.message));
      })}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome do campeonato" error={errors.name?.message}>
          <Input {...register("name")} placeholder="Ex: Paulista Sub-15" />
        </FormField>
        <FormField label="Temporada" error={errors.season?.message}>
          <Input {...register("season")} placeholder="2026" />
        </FormField>
        <FormField label="Status" error={errors.status?.message}>
          <Select {...register("status")}>
            {Object.entries(CHAMPIONSHIP_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Data início">
          <Input type="date" {...register("startDate")} />
        </FormField>
        <FormField label="Data fim">
          <Input type="date" {...register("endDate")} />
        </FormField>
      </div>
      <FormField label="Descrição">
        <Textarea {...register("description")} rows={3} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUpload label="Logo" category="championship" value={logoUrl} onChange={(v) => setValue("logoUrl", v)} />
        <ImageUpload label="Banner / capa" category="banner" value={bannerUrl} onChange={(v) => setValue("bannerUrl", v)} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
