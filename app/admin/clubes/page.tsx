"use client";

import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { ClubForm } from "@/components/admin/forms/ClubForm";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { CLUB_STATUS_LABELS } from "@/lib/admin-labels";

type Row = {
  id: string;
  name: string;
  city?: string | null;
  state?: string;
  status: string;
  crestUrl?: string | null;
};

export default function AdminClubesPage() {
  return (
    <AdminEntityPage<Row>
      entity="clubs"
      title="Clubes"
      description="Cadastro de clubes, escudos, banners e status de aprovação."
      searchPlaceholder="Buscar clube..."
      FormComponent={ClubForm}
      columns={[
        { key: "crest", header: "", cell: (r) => <Thumb src={r.crestUrl} alt={r.name} /> },
        { key: "name", header: "Clube", cell: (r) => <span className="font-medium">{r.name}</span> },
        { key: "city", header: "Cidade", cell: (r) => `${r.city ?? "—"} / ${r.state ?? "SP"}` },
        {
          key: "status",
          header: "Status",
          cell: (r) => <StatusBadge status={r.status} label={CLUB_STATUS_LABELS[r.status] ?? r.status} />,
        },
      ]}
    />
  );
}
