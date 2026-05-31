"use client";

import { useCallback } from "react";
import { Users } from "lucide-react";
import { AdminGroupedListPage } from "@/components/admin/shared/AdminGroupedListPage";
import { AdminListRowActions } from "@/components/admin/shared/AdminListRowActions";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { SectorUsersGuide } from "@/components/admin/SectorUsersGuide";
import { UserForm } from "@/components/admin/forms/UserForm";
import { ROLE_LABELS, USER_STATUS_LABELS } from "@/lib/admin-labels";
import { groupItemsByKey, sortKeysByOrder } from "@/lib/admin-list-groups";

type Row = {
  id: string;
  name: string | null;
  email: string;
  status: string;
  role: string;
  clubs: string[];
};

const ROLE_ORDER = [
  "SUPER_ADMIN",
  "ADMIN_LIGA",
  "OPERADOR_DE_PARTIDA",
  "CLUBE",
  "SCOUT",
  "VISITANTE",
];

function buildUserGroups(items: Row[]) {
  return groupItemsByKey(items, (r) => r.role, {
    getLabel: (key) => ROLE_LABELS[key] ?? key,
    sortKeys: (keys) => sortKeysByOrder(keys, ROLE_ORDER),
    sortItems: (a, b) =>
      (a.name ?? a.email).localeCompare(b.name ?? b.email, "pt-BR"),
  });
}

function UserListRow({
  row,
  onEdit,
  onDelete,
}: {
  row: Row;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const displayName = row.name?.trim() || row.email;

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[1fr_8rem_5.5rem_auto] sm:gap-4 sm:items-center sm:px-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground leading-snug">{displayName}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{row.email}</p>
        {row.clubs.length > 0 ? (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 sm:hidden" title={row.clubs.join(", ")}>
            {row.clubs.join(", ")}
          </p>
        ) : null}
      </div>
      <p
        className="hidden sm:block text-xs text-muted-foreground truncate"
        title={row.clubs.join(", ") || undefined}
      >
        {row.clubs.join(", ") || "—"}
      </p>
      <div className="shrink-0 sm:justify-self-start">
        <StatusBadge status={row.status} label={USER_STATUS_LABELS[row.status] ?? row.status} />
      </div>
      <AdminListRowActions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={`Editar ${displayName}`}
        deleteLabel={`Excluir ${displayName}`}
      />
    </div>
  );
}

export function AdminUsersPage() {
  const buildGroups = useCallback((items: Row[]) => buildUserGroups(items), []);

  return (
    <div className="space-y-6">
      <SectorUsersGuide />
      <AdminGroupedListPage<Row>
        apiBase="/api/admin/users"
        entity="users"
        title="Usuários"
        description="Contas, papéis, clubes vinculados e acesso ao sistema."
        searchPlaceholder="Buscar por nome ou e-mail..."
        emptyMessage="Nenhum usuário encontrado."
        filterAriaLabel="Filtrar por papel"
        pillAllLabel="Todos os papéis"
        sectionIcon={Users}
        countLabel={(n) => `${n} ${n === 1 ? "usuário" : "usuários"}`}
        dialogTitles={{ new: "Novo usuário", edit: "Editar usuário" }}
        deleteConfirm={(r) =>
          `Excluir ${r.name ?? r.email}? Esta ação não pode ser desfeita.`
        }
        FormComponent={UserForm}
        buildGroups={buildGroups}
        renderDesktopHeader={() => (
          <div className="hidden sm:grid sm:grid-cols-[1fr_8rem_5.5rem_auto] sm:gap-4 sm:items-center px-4 py-2 bg-secondary/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>Usuário / E-mail</span>
            <span>Clubes</span>
            <span>Status</span>
            <span className="text-right w-[4.5rem]">Ações</span>
          </div>
        )}
        renderRow={({ row, onEdit, onDelete }) => (
          <UserListRow row={row} onEdit={onEdit} onDelete={onDelete} />
        )}
      />
    </div>
  );
}
