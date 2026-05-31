"use client";

import { useCallback } from "react";
import { Menu } from "lucide-react";
import { AdminGroupedListPage } from "@/components/admin/shared/AdminGroupedListPage";
import { AdminListRowActions } from "@/components/admin/shared/AdminListRowActions";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { MenuForm } from "@/components/admin/forms/MenuForm";
import { MENU_AREA_LABELS } from "@/lib/admin-labels";
import { groupItemsByKey, sortKeysByOrder } from "@/lib/admin-list-groups";

type Row = {
  id: string;
  label: string;
  href: string;
  area: string;
  order: number;
  isActive: boolean;
};

const AREA_ORDER = ["PUBLIC", "CLUBE", "ADMIN"];

function buildMenuGroups(items: Row[]) {
  return groupItemsByKey(items, (r) => r.area, {
    getLabel: (key) => MENU_AREA_LABELS[key] ?? key,
    sortKeys: (keys) => sortKeysByOrder(keys, AREA_ORDER),
    sortItems: (a, b) => a.order - b.order || a.label.localeCompare(b.label, "pt-BR"),
  });
}

function MenuListRow({
  row,
  onEdit,
  onDelete,
}: {
  row: Row;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[1fr_8rem_4rem_5.5rem_auto] sm:gap-4 sm:items-center sm:px-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground leading-snug">{row.label}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">{row.href}</p>
        <p className="text-xs text-muted-foreground mt-1 sm:hidden tabular-nums">
          Ordem {row.order}
        </p>
      </div>
      <p className="hidden sm:block text-xs text-muted-foreground truncate" title={row.href}>
        {row.href}
      </p>
      <p className="hidden sm:block text-sm text-muted-foreground tabular-nums text-right">
        {row.order}
      </p>
      <div className="shrink-0 sm:justify-self-start">
        <StatusBadge
          status={row.isActive ? "ACTIVE" : "INACTIVE"}
          label={row.isActive ? "Ativo" : "Inativo"}
        />
      </div>
      <AdminListRowActions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={`Editar ${row.label}`}
        deleteLabel={`Excluir ${row.label}`}
      />
    </div>
  );
}

export function AdminMenuPage() {
  const buildGroups = useCallback((items: Row[]) => buildMenuGroups(items), []);

  return (
    <AdminGroupedListPage<Row>
      entity="menu_items"
      title="Menu público"
      description="Links de navegação do site e portais por área."
      searchPlaceholder="Buscar item..."
      emptyMessage="Nenhum item de menu."
      filterAriaLabel="Filtrar por área"
      pillAllLabel="Todas as áreas"
      sectionIcon={Menu}
      countLabel={(n) => `${n} ${n === 1 ? "item" : "itens"}`}
      dialogTitles={{ new: "Novo item", edit: "Editar item" }}
      deleteConfirm={(r) => `Excluir "${r.label}" do menu? Esta ação não pode ser desfeita.`}
      FormComponent={MenuForm}
      buildGroups={buildGroups}
      renderDesktopHeader={() => (
        <div className="hidden sm:grid sm:grid-cols-[1fr_8rem_4rem_5.5rem_auto] sm:gap-4 sm:items-center px-4 py-2 bg-secondary/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span>Rótulo / Link</span>
          <span>URL</span>
          <span className="text-right">Ordem</span>
          <span>Status</span>
          <span className="text-right w-[4.5rem]">Ações</span>
        </div>
      )}
      renderRow={({ row, onEdit, onDelete }) => (
        <MenuListRow row={row} onEdit={onEdit} onDelete={onDelete} />
      )}
    />
  );
}
