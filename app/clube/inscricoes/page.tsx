"use client";

import { ClubEntityPage } from "@/components/clube/ClubEntityPage";
import { ClubRegistrationForm } from "@/components/clube/forms/ClubRegistrationForm";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";

type Row = {
  id: string;
  status: string;
  championship?: { name: string };
};

export default function ClubeInscricoesPage() {
  return (
    <ClubEntityPage<Row>
      entity="registrations"
      title="Inscrições"
      description="Inscreva seu clube nos campeonatos oficiais."
      FormComponent={ClubRegistrationForm}
      columns={[
        { key: "champ", header: "Campeonato", cell: (r) => r.championship?.name ?? "—" },
        {
          key: "status",
          header: "Status",
          cell: (r) => <StatusBadge status={r.status} label={r.status} />,
        },
      ]}
    />
  );
}
