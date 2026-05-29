"use client";

import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { NewsForm } from "@/components/admin/forms/NewsForm";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Row = {
  id: string;
  title: string;
  category?: string | null;
  isFeatured: boolean;
  publishedAt?: string | null;
  imageUrl?: string | null;
};

export default function AdminNoticiasPage() {
  return (
    <AdminEntityPage<Row>
      entity="news"
      title="Notícias"
      description="Publicações, destaques e imagens de capa."
      searchPlaceholder="Buscar notícia..."
      FormComponent={NewsForm}
      columns={[
        { key: "img", header: "", cell: (r) => <Thumb src={r.imageUrl} /> },
        { key: "title", header: "Título", cell: (r) => <span className="font-medium line-clamp-1">{r.title}</span> },
        { key: "cat", header: "Categoria", cell: (r) => r.category ?? "—" },
        {
          key: "pub",
          header: "Publicação",
          cell: (r) => (r.publishedAt ? formatDate(r.publishedAt) : "Rascunho"),
        },
        {
          key: "feat",
          header: "Destaque",
          cell: (r) =>
            r.isFeatured ? (
              <Badge variant="outline" className="text-neon border-neon/30">
                Sim
              </Badge>
            ) : (
              "—"
            ),
        },
      ]}
    />
  );
}
