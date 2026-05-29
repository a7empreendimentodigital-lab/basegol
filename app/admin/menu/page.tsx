"use client";

import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { MenuForm } from "@/components/admin/forms/MenuForm";

type Row = {
  id: string;
  label: string;
  href: string;
  area: string;
  order: number;
  isActive: boolean;
};

export default function AdminMenuPage() {
  return (
    <AdminEntityPage<Row>
      entity="menu_items"
      title="Menu"
      description="Itens de navegação do site público e áreas logadas."
      FormComponent={MenuForm}
      columns={[
        { key: "label", header: "Rótulo", cell: (r) => r.label },
        { key: "href", header: "Link", cell: (r) => r.href },
        { key: "area", header: "Área", cell: (r) => r.area },
        { key: "order", header: "Ordem", cell: (r) => r.order },
        { key: "active", header: "Ativo", cell: (r) => (r.isActive ? "Sim" : "Não") },
      ]}
    />
  );
}
