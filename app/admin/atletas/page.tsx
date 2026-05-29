"use client";

import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { AthleteForm } from "@/components/admin/forms/AthleteForm";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { ATHLETE_STATUS_LABELS, PLAYER_POSITION_LABELS } from "@/lib/admin-labels";

type Row = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  shirtNumber?: number | null;
  status: string;
  photoUrl?: string | null;
  club?: { name: string };
};

export default function AdminAtletasPage() {
  return (
    <AdminEntityPage<Row>
      entity="athletes"
      title="Atletas"
      description="Elenco, fotos, posições e vínculo com clubes."
      searchPlaceholder="Buscar atleta..."
      FormComponent={AthleteForm}
      columns={[
        { key: "photo", header: "", cell: (r) => <Thumb src={r.photoUrl} /> },
        {
          key: "name",
          header: "Atleta",
          cell: (r) => (
            <span className="font-medium">
              {r.firstName} {r.lastName}
              {r.shirtNumber != null ? ` · #${r.shirtNumber}` : ""}
            </span>
          ),
        },
        { key: "club", header: "Clube", cell: (r) => r.club?.name ?? "—" },
        { key: "pos", header: "Posição", cell: (r) => PLAYER_POSITION_LABELS[r.position] ?? r.position },
        {
          key: "status",
          header: "Status",
          cell: (r) => <StatusBadge status={r.status} label={ATHLETE_STATUS_LABELS[r.status] ?? r.status} />,
        },
      ]}
    />
  );
}
