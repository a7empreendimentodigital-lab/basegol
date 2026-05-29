"use client";

import { ClubEntityPage } from "@/components/clube/ClubEntityPage";
import { ClubAthleteForm } from "@/components/clube/forms/ClubAthleteForm";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { ATHLETE_STATUS_LABELS, PLAYER_POSITION_LABELS } from "@/lib/admin-labels";

type Row = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  shirtNumber?: number | null;
  status: string;
  photoUrl?: string | null;
};

export default function ClubeAtletasPage() {
  return (
    <ClubEntityPage<Row>
      entity="athletes"
      title="Atletas do clube"
      description="Cadastre e gerencie o elenco do seu clube."
      searchPlaceholder="Buscar atleta..."
      FormComponent={ClubAthleteForm}
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
