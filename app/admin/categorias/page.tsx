"use client";

import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { CategoryForm } from "@/components/admin/forms/CategoryForm";
import { Thumb } from "@/components/admin/shared/AdminDataTable";

type Row = {
  id: string;
  name: string;
  ageGroup?: string | null;
  imageUrl?: string | null;
  championship?: { name: string };
};

export default function AdminCategoriasPage() {
  return (
    <AdminEntityPage<Row>
      entity="categories"
      title="Categorias"
      description="Faixas etárias e divisões dentro de cada campeonato."
      searchPlaceholder="Buscar categoria..."
      FormComponent={CategoryForm}
      columns={[
        { key: "img", header: "", cell: (r) => <Thumb src={r.imageUrl} /> },
        { key: "name", header: "Categoria", cell: (r) => r.name },
        { key: "age", header: "Faixa", cell: (r) => r.ageGroup ?? "—" },
        { key: "champ", header: "Campeonato", cell: (r) => r.championship?.name ?? "—" },
      ]}
    />
  );
}
