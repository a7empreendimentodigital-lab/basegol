"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeImage } from "@/components/ui/SafeImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/admin/forms/FormField";
import { matchFormSchema } from "@/utils/zod-schemas/admin-entities";
import { useAdminFormFeedback } from "@/components/admin/forms/admin-form-feedback";
import { submitEntity } from "@/components/admin/forms/submit-entity";
import { useAdminOptions } from "@/hooks/use-admin-options";
import { MATCH_STATUS_LABELS } from "@/lib/admin-labels";
import { dateTimeToInputValues } from "@/lib/datetime-input";
import { type AdminFormProps, str } from "@/components/admin/forms/types";

type MatchFormInput = z.input<typeof matchFormSchema>;
type MatchFormOutput = z.output<typeof matchFormSchema>;

type MatchFormProps = AdminFormProps & {
  /** Painel do campeonato: restringe grupos ao campeonato atual. */
  championshipId?: string;
};

export function MatchForm({ initial, onSuccess, onCancel, championshipId }: MatchFormProps) {
  const id = str(initial?.id);
  const { onSaveError, onValidationError } = useAdminFormFeedback();
  const [saving, setSaving] = useState(false);
  function buildDefaults(source?: Record<string, unknown> | null): MatchFormInput {
    const { scheduledDate, scheduledTime } = dateTimeToInputValues(
      source?.scheduledAt ? String(source.scheduledAt) : new Date()
    );
    return {
      groupId: str(source?.groupId),
      homeTeamId: str(source?.homeTeamId),
      awayTeamId: str(source?.awayTeamId),
      round: Number(source?.round ?? 1),
      venue: str(source?.venue),
      status: (str(source?.status, "SCHEDULED") as MatchFormInput["status"]) ?? "SCHEDULED",
      scheduledDate,
      scheduledTime,
    };
  }

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } =
    useForm<MatchFormInput>({
      resolver: zodResolver(matchFormSchema),
      defaultValues: buildDefaults(initial),
    });

  const groupId = watch("groupId");
  const homeTeamId = watch("homeTeamId");
  const awayTeamId = watch("awayTeamId");
  const { options: groups } = useAdminOptions("groups", {
    championshipId: championshipId || undefined,
  });
  const { options: teams, loading: teamsLoading } = useAdminOptions("teams", { groupId });

  useEffect(() => {
    if (!id) {
      setValue("homeTeamId", "");
      setValue("awayTeamId", "");
    }
  }, [groupId, id, setValue]);

  const homeTeam = teams.find((t) => t.value === homeTeamId);
  const awayTeam = teams.find((t) => t.value === awayTeamId);

  return (
    <form
      onSubmit={handleSubmit(async () => {
        const parsed = matchFormSchema.parse(getValues()) as MatchFormOutput;
        if (parsed.homeTeamId === parsed.awayTeamId) {
          onValidationError("Mandante e visitante devem ser equipes diferentes.");
          return;
        }

        setSaving(true);
        try {
          await submitEntity("matches", parsed, id || undefined);
          onSuccess();
        } catch (e) {
          onSaveError(e);
        } finally {
          setSaving(false);
        }
      }, (fieldErrors) => {
        const first = Object.values(fieldErrors)[0];
        if (first?.message) onValidationError(String(first.message));
      })}
      className="space-y-4"
    >
      <FormField label="Grupo / fase" error={errors.groupId?.message}>
        <Select {...register("groupId")}>
          <option value="">Selecione...</option>
          {groups.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>

      {groupId && !teamsLoading && teams.length === 0 ? (
        <p className="text-xs text-muted-foreground rounded-lg border border-line bg-graphite-light px-3 py-2">
          Nenhuma equipe neste grupo. Confira se o grupo selecionado é o mesmo em que os clubes foram inscritos
          (Admin → Grupos → editar o grupo).
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Mandante" error={errors.homeTeamId?.message}>
          <Select {...register("homeTeamId")} disabled={!groupId || teamsLoading || teams.length === 0}>
            <option value="">
              {!groupId
                ? "Selecione o grupo primeiro"
                : teamsLoading
                  ? "Carregando..."
                  : teams.length === 0
                    ? "Sem equipes no grupo"
                    : "Selecione..."}
            </option>
            {teams.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          {homeTeam?.crestUrl && (
            <div className="relative h-8 w-8 mt-2">
              <SafeImage src={homeTeam.crestUrl} alt="" fill className="object-contain" />
            </div>
          )}
        </FormField>
        <FormField label="Visitante" error={errors.awayTeamId?.message}>
          <Select {...register("awayTeamId")} disabled={!groupId || teamsLoading || teams.length === 0}>
            <option value="">
              {!groupId
                ? "Selecione o grupo primeiro"
                : teamsLoading
                  ? "Carregando..."
                  : teams.length === 0
                    ? "Sem equipes no grupo"
                    : "Selecione..."}
            </option>
            {teams.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          {awayTeam?.crestUrl && (
            <div className="relative h-8 w-8 mt-2">
              <SafeImage src={awayTeam.crestUrl} alt="" fill className="object-contain" />
            </div>
          )}
        </FormField>
        <FormField label="Data" error={errors.scheduledDate?.message}>
          <Input type="date" {...register("scheduledDate")} />
        </FormField>
        <FormField label="Horário" error={errors.scheduledTime?.message}>
          <Input type="time" {...register("scheduledTime")} />
        </FormField>
        <FormField label="Rodada">
          <Input type="number" {...register("round")} />
        </FormField>
        <FormField label="Local">
          <Input {...register("venue")} placeholder="Arena, CT..." />
        </FormField>
        <FormField label="Status">
          <Select {...register("status")}>
            {Object.entries(MATCH_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || !groupId || teams.length === 0}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
