"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/admin/forms/FormField";
import { clubRegistrationSchema } from "@/utils/zod-schemas/club-portal.schemas";
import { submitClubEntity } from "@/components/clube/forms/submit-club-entity";
import { useAdminOptions } from "@/hooks/use-admin-options";
import type { EntityFormProps } from "@/components/crud/EntityPage";
import { str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof clubRegistrationSchema>;

export function ClubRegistrationForm({ initial, onSuccess, onCancel }: EntityFormProps) {
  const id = str(initial?.id);
  const { options: championships } = useAdminOptions("championships");
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(clubRegistrationSchema),
    defaultValues: {
      championshipId: str(initial?.championshipId),
      notes: str(initial?.notes),
      status: (str(initial?.status, "PENDING") as FormData["status"]) ?? "PENDING",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitClubEntity("registrations", data, id || undefined);
          onSuccess();
        } catch (e) {
          alert(e instanceof Error ? e.message : "Erro");
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Campeonato" error={errors.championshipId?.message}>
        <Select {...register("championshipId")}>
          <option value="">Selecione...</option>
          {championships.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Observações">
        <Textarea {...register("notes")} rows={3} />
      </FormField>
      <FormField label="Status">
        <Select {...register("status")}>
          <option value="PENDING">Pendente</option>
          <option value="APPROVED">Aprovada</option>
          <option value="REJECTED">Rejeitada</option>
          <option value="WITHDRAWN">Desistência</option>
        </Select>
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
