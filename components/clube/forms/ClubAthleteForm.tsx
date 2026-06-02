"use client";

import { useAdminFormFeedback } from "@/components/admin/forms/admin-form-feedback";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/admin/forms/FormField";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { clubAthletePortalSchema } from "@/utils/zod-schemas/club-portal.schemas";
import { submitClubEntity } from "@/components/clube/forms/submit-club-entity";
import { ATHLETE_STATUS_LABELS, PLAYER_POSITION_LABELS } from "@/lib/admin-labels";
import type { EntityFormProps } from "@/components/crud/EntityPage";
import { num, str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof clubAthletePortalSchema>;

export function ClubAthleteForm({ initial, onSuccess, onCancel }: EntityFormProps) {
  const id = str(initial?.id);
    const { onSaveError } = useAdminFormFeedback();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(clubAthletePortalSchema),
    defaultValues: {
      firstName: str(initial?.firstName),
      lastName: str(initial?.lastName),
      birthDate: initial?.birthDate ? String(initial.birthDate).slice(0, 10) : "",
      position: (str(initial?.position, "CM") as FormData["position"]) ?? "CM",
      shirtNumber: num(initial?.shirtNumber),
      category: str(initial?.category, "Sub-15"),
      status: (str(initial?.status, "ACTIVE") as FormData["status"]) ?? "ACTIVE",
      heightCm: num(initial?.heightCm),
      weightKg: num(initial?.weightKg),
      photoUrl: (initial?.photoUrl as string | null) ?? null,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitClubEntity("athletes", data, id || undefined);
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
        <FormField label="Nome" error={errors.firstName?.message}>
          <Input {...register("firstName")} />
        </FormField>
        <FormField label="Sobrenome" error={errors.lastName?.message}>
          <Input {...register("lastName")} />
        </FormField>
        <FormField label="Data de nascimento" error={errors.birthDate?.message}>
          <Input type="date" {...register("birthDate")} />
        </FormField>
        <FormField label="Número">
          <Input type="number" {...register("shirtNumber")} />
        </FormField>
        <FormField label="Posição">
          <Select {...register("position")}>
            {Object.entries(PLAYER_POSITION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Categoria">
          <Input {...register("category")} />
        </FormField>
        <FormField label="Altura (cm)">
          <Input type="number" {...register("heightCm")} />
        </FormField>
        <FormField label="Peso (kg)">
          <Input type="number" step="0.1" {...register("weightKg")} />
        </FormField>
        <FormField label="Status">
          <Select {...register("status")}>
            {Object.entries(ATHLETE_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <ImageUpload label="Foto" category="athlete" value={watch("photoUrl")} onChange={(v) => setValue("photoUrl", v)} />
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
