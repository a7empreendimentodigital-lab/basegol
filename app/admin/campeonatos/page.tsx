"use client";

import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { ChampionshipForm } from "@/components/admin/forms/ChampionshipForm";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { CHAMPIONSHIP_STATUS_LABELS } from "@/lib/admin-labels";
import { formatDate } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  season: string;
  status: string;
  logoUrl?: string | null;
  startDate?: string | null;
};

export default function AdminCampeonatosPage() {
  return (
    <AdminEntityPage<Row>
      entity="championships"
      title="Campeonatos"
      description="Gerencie competições, temporadas, status e identidade visual."
      searchPlaceholder="Buscar por nome..."
      FormComponent={ChampionshipForm}
      columns={[
        { key: "logo", header: "", cell: (r) => <Thumb src={r.logoUrl} alt={r.name} /> },
        { key: "name", header: "Nome", cell: (r) => <span className="font-medium">{r.name}</span> },
        { key: "season", header: "Temporada", cell: (r) => r.season },
        {
          key: "status",
          header: "Status",
          cell: (r) => (
            <StatusBadge status={r.status} label={CHAMPIONSHIP_STATUS_LABELS[r.status] ?? r.status} />
          ),
        },
        {
          key: "start",
          header: "Início",
          cell: (r) => (r.startDate ? formatDate(r.startDate) : "—"),
        },
      ]}
    />
  );
}
