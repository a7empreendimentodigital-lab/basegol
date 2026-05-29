"use client";

import { EntityPage } from "@/components/crud/EntityPage";
import { SectorUsersGuide } from "@/components/admin/SectorUsersGuide";
import { UserForm } from "@/components/admin/forms/UserForm";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { ROLE_LABELS, USER_STATUS_LABELS } from "@/lib/admin-labels";

type Row = {
  id: string;
  name: string | null;
  email: string;
  status: string;
  role: string;
  clubs: string[];
};

export default function AdminUsuariosPage() {
  return (
    <div className="space-y-6">
      <SectorUsersGuide />
    <EntityPage<Row>
      apiBase="/api/admin/users"
      entity=""
      title="Usuários"
      description="Gerencie contas, papéis, vínculo com clubes e status de acesso."
      searchPlaceholder="Buscar por nome ou e-mail..."
      FormComponent={UserForm}
      columns={[
        { key: "name", header: "Nome", cell: (r) => <span className="font-medium">{r.name ?? "—"}</span> },
        { key: "email", header: "E-mail", cell: (r) => r.email },
        {
          key: "role",
          header: "Papel",
          cell: (r) => ROLE_LABELS[r.role] ?? r.role,
        },
        {
          key: "status",
          header: "Status",
          cell: (r) => <StatusBadge status={r.status} label={USER_STATUS_LABELS[r.status] ?? r.status} />,
        },
        { key: "clubs", header: "Clubes", cell: (r) => r.clubs.join(", ") || "—" },
      ]}
    />
    </div>
  );
}
