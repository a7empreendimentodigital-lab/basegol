"use client";

import { useCallback } from "react";
import { Palette } from "lucide-react";
import { AdminGroupedListPage } from "@/components/admin/shared/AdminGroupedListPage";
import { AdminListRowActions } from "@/components/admin/shared/AdminListRowActions";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { ThemeForm } from "@/components/admin/forms/ThemeForm";
import { adminListSingleGroup } from "@/lib/admin-list-groups";

type Row = {
  id: string;
  name: string;
  isActive: boolean;
  primaryColor: string;
};

function ThemeListRow({
  row,
  onEdit,
  onDelete,
}: {
  row: Row;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[1fr_7rem_5.5rem_auto] sm:gap-4 sm:items-center sm:px-4">
      <p className="font-medium text-foreground">{row.name}</p>
      <span className="flex items-center gap-2 text-sm text-muted-foreground sm:justify-self-start">
        <span
          className="h-6 w-6 rounded border border-line shrink-0"
          style={{ background: row.primaryColor }}
          aria-hidden
        />
        <span className="font-mono text-xs tabular-nums">{row.primaryColor}</span>
      </span>
      <div className="shrink-0 sm:justify-self-start">
        <StatusBadge
          status={row.isActive ? "ACTIVE" : "INACTIVE"}
          label={row.isActive ? "Ativo" : "Inativo"}
        />
      </div>
      <AdminListRowActions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={`Editar ${row.name}`}
        deleteLabel={`Excluir ${row.name}`}
      />
    </div>
  );
}

export function AdminThemePage() {
  const buildGroups = useCallback(
    (items: Row[]) => adminListSingleGroup(items, "Temas"),
    []
  );

  return (
    <AdminGroupedListPage<Row>
      entity="theme_configs"
      title="Temas"
      description="Paletas de cores da plataforma. Apenas um tema fica ativo por vez."
      searchPlaceholder="Buscar tema..."
      emptyMessage="Nenhum tema cadastrado."
      sectionIcon={Palette}
      countLabel={(n) => `${n} ${n === 1 ? "tema" : "temas"}`}
      dialogTitles={{ new: "Novo tema", edit: "Editar tema" }}
      deleteConfirm={(r) => `Excluir o tema "${r.name}"? Esta ação não pode ser desfeita.`}
      FormComponent={ThemeForm}
      buildGroups={buildGroups}
      renderDesktopHeader={() => (
        <div className="hidden sm:grid sm:grid-cols-[1fr_7rem_5.5rem_auto] sm:gap-4 sm:items-center px-4 py-2 bg-secondary/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span>Nome</span>
          <span>Cor primária</span>
          <span>Status</span>
          <span className="text-right w-[4.5rem]">Ações</span>
        </div>
      )}
      renderRow={({ row, onEdit, onDelete }) => (
        <ThemeListRow row={row} onEdit={onEdit} onDelete={onDelete} />
      )}
    />
  );
}
