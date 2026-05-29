"use client";

import { ClubEntityPage } from "@/components/clube/ClubEntityPage";
import { ClubStaffForm } from "@/components/clube/forms/ClubStaffForm";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { STAFF_ROLE_LABELS } from "@/lib/admin-labels";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";

type Row = {
  id: string;
  name: string;
  role: string;
  status: string;
  photoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
};

export default function ClubeComissaoPage() {
  return (
    <ClubEntityPage<Row>
      entity="staff"
      title="Comissão técnica"
      description="Cadastro da comissão técnica do seu clube."
      FormComponent={ClubStaffForm}
      columns={[
        { key: "photo", header: "", cell: (r) => <Thumb src={r.photoUrl} /> },
        { key: "name", header: "Nome", cell: (r) => r.name },
        { key: "role", header: "Função", cell: (r) => STAFF_ROLE_LABELS[r.role] ?? r.role },
        { key: "contact", header: "Contato", cell: (r) => r.phone ?? r.email ?? "—" },
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
