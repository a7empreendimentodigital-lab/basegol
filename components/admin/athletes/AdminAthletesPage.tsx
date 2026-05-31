"use client";

import { useCallback } from "react";
import { Users } from "lucide-react";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { AdminGroupedListPage } from "@/components/admin/shared/AdminGroupedListPage";
import { AdminListRowActions } from "@/components/admin/shared/AdminListRowActions";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { AthleteForm } from "@/components/admin/forms/AthleteForm";
import { ATHLETE_STATUS_LABELS, PLAYER_POSITION_LABELS } from "@/lib/admin-labels";
import { groupAthletesByCategory, type SquadAthlete } from "@/lib/athlete-category";
import type { ListGroup } from "@/lib/admin-list-groups";
import { clubSigla } from "@/lib/club-display";

type AthleteRow = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  shirtNumber?: number | null;
  status: string;
  photoUrl?: string | null;
  category?: string | null;
  club?: { name: string; shortName?: string | null };
};

function rowToSquad(row: AthleteRow): SquadAthlete {
  return {
    id: row.id,
    slug: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    position: row.position,
    photoUrl: row.photoUrl ?? null,
    shirtNumber: row.shirtNumber ?? null,
    category: row.category ?? null,
  };
}

function buildAthleteGroups(items: AthleteRow[]): ListGroup<AthleteRow>[] {
  const rowById = new Map(items.map((r) => [r.id, r]));
  return groupAthletesByCategory(items.map(rowToSquad)).map((g) => ({
    key: g.category,
    label: g.category,
    items: g.athletes.map((a) => rowById.get(a.id)!).filter(Boolean),
  }));
}

function AthleteListRow({
  row,
  onEdit,
  onDelete,
}: {
  row: AthleteRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const fullName = `${row.firstName} ${row.lastName}`;
  const clubLabel = row.club ? clubSigla(row.club.shortName, row.club.name) : "—";

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[auto_1fr_7rem_5.5rem_auto] sm:gap-4 sm:items-center sm:px-4">
      <Thumb src={row.photoUrl} alt={fullName} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground leading-snug">
          {fullName}
          {row.shirtNumber != null ? (
            <span className="text-muted-foreground font-normal"> · #{row.shirtNumber}</span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5" title={row.club?.name}>
          {clubLabel}
        </p>
        <p className="text-xs text-muted-foreground mt-1 sm:hidden">
          {PLAYER_POSITION_LABELS[row.position] ?? row.position}
        </p>
      </div>
      <p className="hidden sm:block text-sm text-muted-foreground text-right">
        {PLAYER_POSITION_LABELS[row.position] ?? row.position}
      </p>
      <div className="shrink-0 sm:justify-self-start">
        <StatusBadge status={row.status} label={ATHLETE_STATUS_LABELS[row.status] ?? row.status} />
      </div>
      <AdminListRowActions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={`Editar ${fullName}`}
        deleteLabel={`Excluir ${fullName}`}
      />
    </div>
  );
}

export function AdminAthletesPage() {
  const buildGroups = useCallback((items: AthleteRow[]) => buildAthleteGroups(items), []);

  return (
    <AdminGroupedListPage<AthleteRow>
      entity="athletes"
      title="Atletas"
      description="Elenco, fotos, posições e vínculo com clubes."
      searchPlaceholder="Buscar atleta..."
      emptyMessage="Nenhum atleta encontrado."
      filterAriaLabel="Filtrar por categoria"
      pillAllLabel="Todas"
      sectionIcon={Users}
      countLabel={(n) => `${n} ${n === 1 ? "atleta" : "atletas"}`}
      dialogTitles={{ new: "Novo atleta", edit: "Editar atleta" }}
      deleteConfirm={(r) => `Excluir ${r.firstName} ${r.lastName}? Esta ação não pode ser desfeita.`}
      FormComponent={AthleteForm}
      buildGroups={buildGroups}
      renderDesktopHeader={() => (
        <div className="hidden sm:grid sm:grid-cols-[auto_1fr_7rem_5.5rem_auto] sm:gap-4 sm:items-center px-4 py-2 bg-secondary/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="w-10" />
          <span>Atleta / Clube</span>
          <span className="text-right">Posição</span>
          <span>Status</span>
          <span className="text-right w-[4.5rem]">Ações</span>
        </div>
      )}
      renderRow={({ row, onEdit, onDelete }) => (
        <AthleteListRow row={row} onEdit={onEdit} onDelete={onDelete} />
      )}
    />
  );
}
