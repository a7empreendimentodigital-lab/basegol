"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { brandConfigSchema } from "@/utils/zod-schemas/admin-entities";
import { parseApiResponse } from "@/lib/api-client";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { useToast } from "@/components/ui/toaster";

type FormData = z.infer<typeof brandConfigSchema>;
type BrandRow = FormData & { id: string };

export function BrandCms() {
  const { toast } = useToast();
  const [record, setRecord] = useState<BrandRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>({
    resolver: zodResolver(brandConfigSchema),
    defaultValues: {
      systemName: "BASEGOL",
      slogan: "",
      logoUrl: null,
      mobileLogoUrl: null,
      faviconUrl: null,
      splashScreenUrl: null,
      loginBackgroundUrl: null,
      homeHeroBackgroundUrl: null,
    },
  });

  useEffect(() => {
    void fetch("/api/admin/crud/brand_configs?page=1&pageSize=1")
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await parseApiResponse<{ items: BrandRow[] }>(res);
        return data.items?.[0] ?? null;
      })
      .then((row) => {
        if (row) {
          setRecord(row);
          reset({
            systemName: row.systemName,
            slogan: row.slogan ?? "",
            logoUrl: row.logoUrl,
            mobileLogoUrl: row.mobileLogoUrl ?? null,
            faviconUrl: row.faviconUrl,
            splashScreenUrl: row.splashScreenUrl,
            loginBackgroundUrl: row.loginBackgroundUrl,
            homeHeroBackgroundUrl: row.homeHeroBackgroundUrl,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [reset]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando personalização...</p>;
  }

  return (
    <div>
      <AdminPageHeader
        title="Marca e identidade"
        description="Logo, favicon, fundos e nome do sistema — sem editar código."
      />
      <form
        className="glass-card p-6 space-y-6 max-w-3xl"
        onSubmit={handleSubmit(async (data) => {
          setSaving(true);
          try {
            if (record?.id) {
              await submitEntity("brand_configs", data, record.id);
            } else {
              const created = await submitEntity<BrandRow>("brand_configs", data);
              setRecord(created);
            }
            toast({ title: "Identidade visual salva", variant: "success" });
          } catch (e) {
            toast({ title: "Erro ao salvar", description: e instanceof Error ? e.message : "", variant: "error" });
          } finally {
            setSaving(false);
          }
        })}
      >
        <FormField label="Nome do sistema">
          <Input {...register("systemName")} />
        </FormField>
        <FormField label="Slogan">
          <Input {...register("slogan")} />
        </FormField>
        <p className="text-xs text-muted-foreground -mt-2">
          O logo mobile é usado no menu e rodapé das páginas Início, Sobre e Contato.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageUpload
            label="Logo do sistema (desktop / sidebar)"
            category="logo"
            value={watch("logoUrl")}
            onChange={(v) => setValue("logoUrl", v, { shouldDirty: true, shouldValidate: true })}
          />
          <ImageUpload
            label="Logo mobile (menu e rodapé institucional)"
            category="logo"
            value={watch("mobileLogoUrl")}
            onChange={(v) => setValue("mobileLogoUrl", v, { shouldDirty: true, shouldValidate: true })}
          />
          <ImageUpload
            label="Favicon"
            category="favicon"
            value={watch("faviconUrl")}
            onChange={(v) => setValue("faviconUrl", v, { shouldDirty: true, shouldValidate: true })}
          />
          <ImageUpload
            label="Fundo do login"
            category="login"
            value={watch("loginBackgroundUrl")}
            onChange={(v) => setValue("loginBackgroundUrl", v, { shouldDirty: true, shouldValidate: true })}
          />
          <ImageUpload
            label="Splash screen"
            category="splash"
            value={watch("splashScreenUrl")}
            onChange={(v) => setValue("splashScreenUrl", v, { shouldDirty: true, shouldValidate: true })}
          />
        </div>
        <div className="space-y-2">
          <ImageUpload
            label="Fundo da tela inicial (escolha de campeonato)"
            category="banner"
            value={watch("homeHeroBackgroundUrl")}
            onChange={(v) =>
              setValue("homeHeroBackgroundUrl", v, { shouldDirty: true, shouldValidate: true })
            }
          />
          <p className="text-xs text-muted-foreground">
            Usada como fundo em Início, Sobre e Contato. Recomendado: imagem escura (estádio), em
            alta resolução.
          </p>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar personalização"}
        </Button>
      </form>
    </div>
  );
}
