"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { bannerSchema } from "@/utils/zod-schemas/admin-entities";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { type AdminFormProps, bool, str } from "@/components/admin/forms/types";
import { BANNER_PLACEMENT_HINTS, BANNER_PLACEMENT_LABELS } from "@/lib/banner-labels";
import type { BannerPlacement } from "@prisma/client";

type FormData = z.infer<typeof bannerSchema>;

export function BannerForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: str(initial?.title),
      subtitle: str(initial?.subtitle),
      imageUrl: str(initial?.imageUrl),
      linkUrl: str(initial?.linkUrl),
      placement: (str(initial?.placement) || "HERO_CAROUSEL") as BannerPlacement,
      order: Number(initial?.order ?? 0),
      isActive: bool(initial?.isActive, true),
      startsAt: initial?.startsAt ? String(initial.startsAt).slice(0, 10) : "",
      endsAt: initial?.endsAt ? String(initial.endsAt).slice(0, 10) : "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitEntity("banners", data, id || undefined);
          onSuccess();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Erro");
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Título" error={errors.title?.message}>
        <Input {...register("title")} />
      </FormField>
      <FormField label="Subtítulo">
        <Input {...register("subtitle")} />
      </FormField>
      <FormField label="Posição" error={errors.placement?.message}>
        <select
          {...register("placement")}
          className="flex h-10 w-full rounded-md border border-line bg-graphite px-3 py-2 text-sm"
        >
          {(Object.keys(BANNER_PLACEMENT_LABELS) as BannerPlacement[]).map((key) => (
            <option key={key} value={key}>
              {BANNER_PLACEMENT_LABELS[key]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          {BANNER_PLACEMENT_HINTS[watch("placement") as BannerPlacement]}
        </p>
      </FormField>
      <FormField label="Link do patrocinador" error={errors.linkUrl?.message}>
        <Input {...register("linkUrl")} placeholder="https://patrocinador.com ou /campeonatos" />
      </FormField>
      <ImageUpload label="Imagem do banner" category="banner" value={watch("imageUrl") || null} onChange={(v) => setValue("imageUrl", v ?? "")} />
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Ordem">
          <Input type="number" {...register("order")} />
        </FormField>
        <FormField label="Início">
          <Input type="date" {...register("startsAt")} />
        </FormField>
        <FormField label="Fim">
          <Input type="date" {...register("endsAt")} />
        </FormField>
      </div>
      <FormField label="Ativo">
        <Switch checked={watch("isActive")} onCheckedChange={(v) => setValue("isActive", v)} />
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
