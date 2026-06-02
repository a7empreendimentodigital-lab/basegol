"use client";

import { useAdminFormFeedback } from "@/components/admin/forms/admin-form-feedback";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/admin/forms/FormField";
import { AdminRelationSelect } from "@/components/admin/forms/AdminRelationSelect";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { athleteSchema } from "@/utils/zod-schemas/admin-entities";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { useAdminOptions } from "@/hooks/use-admin-options";
import { ATHLETE_STATUS_LABELS, PLAYER_POSITION_LABELS } from "@/lib/admin-labels";
import { relationIdFromInitial } from "@/lib/admin-form-relations";
import { type AdminFormProps, num, str } from "@/components/admin/forms/types";

type FormData = z.infer<typeof athleteSchema>;

function buildDefaults(initial?: Record<string, unknown> | null): FormData {
  return {
    clubId: relationIdFromInitial(initial, "clubId", "club"),
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
    bio: str(initial?.bio),
  };
}

export function AthleteForm({ initial, onSuccess, onCancel }: AdminFormProps) {
  const id = str(initial?.id);
  const { options: clubs, loading: clubsLoading } = useAdminOptions("clubs");
    const { onSaveError } = useAdminFormFeedback();
  const [saving, setSaving] = useState(false);

  const defaultValues = useMemo(() => buildDefaults(initial), [initial?.id, initial]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(athleteSchema),
    defaultValues,
  });

  const getValuesForReset = useCallback(() => buildDefaults(initial), [initial]);

  const clubId = watch("clubId") ?? "";

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        setSaving(true);
        try {
          await submitEntity("athletes", data, id || undefined);
          onSuccess();
        } catch (e) {
          onSaveError(e);
        } finally {
          setSaving(false);
        }
      })}
      className="space-y-4"
    >
      <FormField label="Clube" error={errors.clubId?.message}>
        <AdminRelationSelect
          name="clubId"
          value={clubId}
          options={clubs}
          optionsLoading={clubsLoading}
          setValue={setValue}
          reset={reset}
          syncWhenReady={!!id}
          getValuesForReset={getValuesForReset}
          placeholder="Selecione o clube..."
        />
      </FormField>
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
        <FormField label="Número da camisa">
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
          <Input {...register("category")} placeholder="Sub-15" />
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
      <ImageUpload label="Foto do atleta" category="athlete" value={watch("photoUrl")} onChange={(v) => setValue("photoUrl", v)} />
      <FormField label="Bio">
        <Textarea {...register("bio")} rows={2} />
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
