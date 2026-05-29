"use client";

import { ClubEntityPage } from "@/components/clube/ClubEntityPage";
import { ClubDocumentForm } from "@/components/clube/forms/ClubDocumentForm";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/admin-labels";

type Row = {
  id: string;
  type: string;
  status: string;
  fileName?: string | null;
};

export default function ClubeDocumentosPage() {
  return (
    <ClubEntityPage<Row>
      entity="documents"
      title="Documentos"
      description="Envie e acompanhe documentos obrigatórios do clube."
      FormComponent={ClubDocumentForm}
      columns={[
        { key: "type", header: "Tipo", cell: (r) => DOCUMENT_TYPE_LABELS[r.type] ?? r.type },
        { key: "file", header: "Arquivo", cell: (r) => r.fileName ?? "—" },
        {
          key: "status",
          header: "Status",
          cell: (r) => (
            <StatusBadge status={r.status} label={DOCUMENT_STATUS_LABELS[r.status] ?? r.status} />
          ),
        },
      ]}
    />
  );
}
