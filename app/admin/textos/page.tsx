"use client";

import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { SiteTextForm } from "@/components/admin/forms/SiteTextForm";

type Row = {
  id: string;
  key: string;
  value: string;
  context?: string | null;
};

export default function AdminTextosPage() {
  return (
    <AdminEntityPage<Row>
      entity="site_texts"
      title="Textos do site"
      description="Edite textos exibidos na plataforma sem alterar código."
      searchPlaceholder="Buscar por chave..."
      FormComponent={SiteTextForm}
      columns={[
        { key: "key", header: "Chave", cell: (r) => <code className="text-xs text-neon">{r.key}</code> },
        { key: "value", header: "Texto", cell: (r) => <span className="line-clamp-2">{r.value}</span> },
        { key: "ctx", header: "Contexto", cell: (r) => r.context ?? "—" },
      ]}
    />
  );
}
