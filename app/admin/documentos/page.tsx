"use client";

import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { DocumentForm } from "@/components/admin/forms/DocumentForm";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS } from "@/lib/admin-labels";

type Row = {
  id: string;
  type: string;
  status: string;
  fileName?: string | null;
  club?: { name: string };
};

export default function AdminDocumentosPage() {
  return (
    <AdminEntityPage<Row>
      entity="documents"
      title="Documentos"
      description="Laudos, autorizações e fichas com upload de arquivo."
      FormComponent={DocumentForm}
      columns={[
        { key: "type", header: "Tipo", cell: (r) => DOCUMENT_TYPE_LABELS[r.type] ?? r.type },
        { key: "club", header: "Clube", cell: (r) => r.club?.name ?? "—" },
        { key: "file", header: "Arquivo", cell: (r) => r.fileName ?? "—" },
        {
          key: "status",
          header: "Status",
          cell: (r) => <StatusBadge status={r.status} label={DOCUMENT_STATUS_LABELS[r.status] ?? r.status} />,
        },
      ]}
    />
  );
}
