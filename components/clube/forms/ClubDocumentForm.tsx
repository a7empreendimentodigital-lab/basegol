"use client";

import { useAdminFormFeedback } from "@/components/admin/forms/admin-form-feedback";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/admin/forms/FormField";
import { FileUpload } from "@/components/admin/shared/FileUpload";
import { clubDocumentPortalSchema } from "@/utils/zod-schemas/club-portal.schemas";
import { submitClubEntity } from "@/components/clube/forms/submit-club-entity";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/admin-labels";
import type { EntityFormProps } from "@/components/crud/EntityPage";
import { str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof clubDocumentPortalSchema>;

export function ClubDocumentForm({ initial, onSuccess, onCancel }: EntityFormProps) {
  const id = str(initial?.id);
    const { onSaveError } = useAdminFormFeedback();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(clubDocumentPortalSchema),
    defaultValues: {
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
          await submitClubEntity("documents", data, id || undefined);
          onSuccess();
        } catch (e) {
          onSaveError(e);
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
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
        label="Arquivo"
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
