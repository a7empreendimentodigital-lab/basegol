"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/admin/forms/FormField";
import { FileUpload } from "@/components/admin/shared/FileUpload";
import { documentSchema } from "@/utils/zod-schemas/admin-entities";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { useAdminOptions } from "@/hooks/use-admin-options";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/admin-labels";
import { type AdminFormProps, str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof documentSchema>;

export function DocumentForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
  const { options: clubs } = useAdminOptions("clubs");
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      clubId: (initial?.clubId as string | null) ?? null,
      type: (str(initial?.type, "MEDICAL") as FormData["type"]) ?? "MEDICAL",
      status: (str(initial?.status, "PENDING") as FormData["status"]) ?? "PENDING",
      fileUrl: str(initial?.fileUrl),
      fileName: str(initial?.fileName),
      expiresAt: initial?.expiresAt ? String(initial.expiresAt).slice(0, 10) : "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitEntity("documents", data, id || undefined);
          onSuccess();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Erro");
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Clube">
        <Select {...register("clubId")}>
          <option value="">Nenhum</option>
          {clubs.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tipo">
          <Select {...register("type")}>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status">
          <Select {...register("status")}>
            {Object.entries(DOCUMENT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Validade">
          <input type="date" className="flex h-10 w-full rounded-lg border border-border bg-secondary/80 px-3 text-sm" {...register("expiresAt")} />
        </FormField>
      </div>
      <FileUpload
        label="Arquivo do documento"
        value={watch("fileUrl")}
        fileName={watch("fileName")}
        onChange={(url, name) => {
          setValue("fileUrl", url ?? "");
          setValue("fileName", name ?? "");
        }}
      />
      {errors.fileUrl && <p className="text-xs text-red-400">{errors.fileUrl.message}</p>}
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
