"use client";

import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { SponsorForm } from "@/components/admin/forms/SponsorForm";
import { Thumb } from "@/components/admin/shared/AdminDataTable";

type Row = {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  logoUrl?: string | null;
};

export default function AdminPatrocinadoresPage() {
  return (
    <AdminEntityPage<Row>
      entity="sponsors"
      title="Patrocinadores"
      description="Logos e links de patrocinadores exibidos no site."
      FormComponent={SponsorForm}
      columns={[
        { key: "logo", header: "", cell: (r) => <Thumb src={r.logoUrl} /> },
        { key: "name", header: "Nome", cell: (r) => r.name },
        { key: "order", header: "Ordem", cell: (r) => r.order },
        { key: "active", header: "Ativo", cell: (r) => (r.isActive ? "Sim" : "Não") },
      ]}
    />
  );
}
