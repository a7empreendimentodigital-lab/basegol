"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { clubProfileSchema } from "@/utils/zod-schemas/club-portal.schemas";
import { parseApiResponse } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";

type FormData = z.infer<typeof clubProfileSchema>;

export function ClubProfileForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>({
    resolver: zodResolver(clubProfileSchema),
  });

  useEffect(() => {
    void fetch("/api/club/profile")
      .then(async (r) => (r.ok ? parseApiResponse<Record<string, unknown>>(r) : null))
      .then((club) => {
        if (club) {
          reset({
            name: String(club.name ?? ""),
            shortName: String(club.shortName ?? ""),
            city: String(club.city ?? ""),
            state: String(club.state ?? "SP"),
            description: String(club.description ?? ""),
            crestUrl: (club.crestUrl as string | null) ?? null,
            bannerUrl: (club.bannerUrl as string | null) ?? null,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [reset]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando perfil...</p>;

  return (
    <form
      className="glass-card p-6 space-y-4 max-w-2xl"
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          const res = await fetch("/api/club/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const json = await res.json();
          if (!res.ok || json.ok === false) throw new Error(json.error);
          toast({ title: "Perfil atualizado", variant: "success" });
        } catch (e) {
          toast({ title: "Erro ao salvar", description: e instanceof Error ? e.message : "", variant: "error" });
        } finally {
          setSaving(false);
        }
      })}
    >
      <FormField label="Nome do clube">
        <Input {...register("name")} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Sigla">
          <Input {...register("shortName")} />
        </FormField>
        <FormField label="Cidade">
          <Input {...register("city")} />
        </FormField>
        <FormField label="Estado">
          <Input {...register("state")} maxLength={2} />
        </FormField>
      </div>
      <FormField label="Descrição">
        <Textarea {...register("description")} rows={3} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUpload
          label="Escudo"
          category="crest"
          value={watch("crestUrl")}
          onChange={(v) => setValue("crestUrl", v, { shouldDirty: true, shouldValidate: true })}
        />
        <ImageUpload
          label="Banner"
          category="banner"
          value={watch("bannerUrl")}
          onChange={(v) => setValue("bannerUrl", v, { shouldDirty: true, shouldValidate: true })}
        />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Salvar perfil"}
      </Button>
    </form>
  );
}
