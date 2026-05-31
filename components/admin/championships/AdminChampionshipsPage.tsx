"use client";

import { useCallback } from "react";
import { Trophy } from "lucide-react";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { AdminGroupedListPage } from "@/components/admin/shared/AdminGroupedListPage";
import { AdminListRowActions } from "@/components/admin/shared/AdminListRowActions";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { ChampionshipForm } from "@/components/admin/forms/ChampionshipForm";
import { CHAMPIONSHIP_STATUS_LABELS } from "@/lib/admin-labels";
import { groupItemsByKey, sortKeysByOrder } from "@/lib/admin-list-groups";
import { formatDate } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  season: string;
  status: string;
  logoUrl?: string | null;
  startDate?: string | null;
};

const STATUS_ORDER = ["ACTIVE", "REGISTRATION", "DRAFT", "FINISHED", "CANCELLED"];

function ChampionshipListRow({
  row,
  onEdit,
  onDelete,
}: {
  row: Row;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[auto_1fr_6rem_5.5rem_6rem_auto] sm:gap-4 sm:items-center sm:px-4">
      <Thumb src={row.logoUrl} alt={row.name} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground leading-snug">{row.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
          Temporada {row.season}
          {row.startDate ? ` · ${formatDate(row.startDate)}` : ""}
        </p>
      </div>
      <p className="hidden sm:block text-sm text-muted-foreground">{row.season}</p>
      <div className="shrink-0 sm:justify-self-start">
        <StatusBadge
          status={row.status}
          label={CHAMPIONSHIP_STATUS_LABELS[row.status] ?? row.status}
        />
      </div>
      <p className="hidden sm:block text-sm text-muted-foreground tabular-nums">
        {row.startDate ? formatDate(row.startDate) : "—"}
      </p>
      <AdminListRowActions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={`Editar ${row.name}`}
        deleteLabel={`Excluir ${row.name}`}
      />
    </div>
  );
}

export function AdminChampionshipsPage() {
  const buildGroups = useCallback(
    (items: Row[]) =>
      groupItemsByKey(items, (r) => r.status, {
        getLabel: (k) => CHAMPIONSHIP_STATUS_LABELS[k] ?? k,
        sortKeys: (keys) => sortKeysByOrder(keys, STATUS_ORDER),
        sortItems: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
      }),
    []
  );

  return (
    <AdminGroupedListPage<Row>
      entity="championships"
      title="Campeonatos"
      description="Gerencie competições, temporadas, status e identidade visual."
      searchPlaceholder="Buscar por nome..."
      emptyMessage="Nenhum campeonato encontrado."
      filterAriaLabel="Filtrar por status"
      sectionIcon={Trophy}
      countLabel={(n) => `${n} ${n === 1 ? "campeonato" : "campeonatos"}`}
      dialogTitles={{ new: "Novo campeonato", edit: "Editar campeonato" }}
      deleteConfirm={(r) => `Excluir o campeonato "${r.name}"? Esta ação não pode ser desfeita.`}
      FormComponent={ChampionshipForm}
      buildGroups={buildGroups}
      renderDesktopHeader={() => (
        <div className="hidden sm:grid sm:grid-cols-[auto_1fr_6rem_5.5rem_6rem_auto] sm:gap-4 sm:items-center px-4 py-2 bg-secondary/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="w-10" />
          <span>Nome</span>
          <span>Temporada</span>
          <span>Status</span>
          <span>Início</span>
          <span className="text-right w-[4.5rem]">Ações</span>
        </div>
      )}
      renderRow={({ row, onEdit, onDelete }) => (
        <ChampionshipListRow row={row} onEdit={onEdit} onDelete={onDelete} />
      )}
    />
  );
}
