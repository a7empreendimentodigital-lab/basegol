"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { clubSchema } from "@/utils/zod-schemas/admin-entities";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import {
  notifySaveError,
  notifySaveSuccess,
  saveErrorMessage,
} from "@/components/admin/forms/admin-form-feedback";
import { CLUB_STATUS_LABELS } from "@/lib/admin-labels";
import { useToast } from "@/components/ui/toaster";
import { type AdminFormProps, num, str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof clubSchema>;

export function ClubForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: str(initial?.name),
      shortName: str(initial?.shortName),
      city: str(initial?.city),
      state: str(initial?.state, "SP"),
      status: (str(initial?.status, "PENDING") as FormData["status"]) ?? "PENDING",
      description: str(initial?.description),
      crestUrl: (initial?.crestUrl as string | null) ?? null,
      bannerUrl: (initial?.bannerUrl as string | null) ?? null,
      foundedYear: num(initial?.foundedYear),
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        setFormError(null);
        try {
          await submitEntity("clubs", data, id || undefined);
          notifySaveSuccess(toast, id ? "Clube atualizado" : "Clube cadastrado");
          onSuccess();
        } catch (e) {
          setFormError(saveErrorMessage(e));
          notifySaveError(toast, e);
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      {formError ? (
        <div
          role="alert"
          className="flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <p>{formError}</p>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome do clube" error={errors.name?.message}>
          <Input {...register("name")} />
        </FormField>
        <FormField label="Sigla">
          <Input {...register("shortName")} placeholder="PAL" />
        </FormField>
        <FormField label="Cidade">
          <Input {...register("city")} />
        </FormField>
        <FormField label="Estado">
          <Input {...register("state")} maxLength={2} />
        </FormField>
        <FormField label="Ano de fundação">
          <Input type="number" {...register("foundedYear")} />
        </FormField>
        <FormField label="Status">
          <Select {...register("status")}>
            {Object.entries(CLUB_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <FormField label="Descrição">
        <Textarea {...register("description")} rows={2} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUpload
          label="Escudo"
          category="crest"
          value={watch("crestUrl")}
          onChange={(v) => setValue("crestUrl", v, { shouldDirty: true, shouldValidate: true })}
        />
        <ImageUpload
          label="Banner do clube"
          category="banner"
          value={watch("bannerUrl")}
          onChange={(v) => setValue("bannerUrl", v, { shouldDirty: true, shouldValidate: true })}
        />
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
