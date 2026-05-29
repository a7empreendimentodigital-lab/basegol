"use client";

import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { StaffMemberForm } from "@/components/admin/forms/StaffMemberForm";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { STAFF_ROLE_LABELS } from "@/lib/admin-labels";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";

type Row = {
  id: string;
  name: string;
  role: string;
  status: string;
  photoUrl?: string | null;
  club?: { name: string };
};

export default function AdminComissaoPage() {
  return (
    <AdminEntityPage<Row>
      entity="staff_members"
      title="Comissão técnica"
      description="Cadastro global da comissão técnica vinculada aos clubes."
      searchPlaceholder="Buscar por nome..."
      FormComponent={StaffMemberForm}
      columns={[
        { key: "photo", header: "", cell: (r) => <Thumb src={r.photoUrl} /> },
        { key: "name", header: "Nome", cell: (r) => r.name },
        { key: "role", header: "Função", cell: (r) => STAFF_ROLE_LABELS[r.role] ?? r.role },
        { key: "club", header: "Clube", cell: (r) => r.club?.name ?? "—" },
        {
          key: "status",
          header: "Status",
          cell: (r) => (
            <StatusBadge status={r.status} label={r.status === "ACTIVE" ? "Ativo" : "Inativo"} />
          ),
        },
      ]}
    />
  );
}
