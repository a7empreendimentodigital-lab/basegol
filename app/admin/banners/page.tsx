"use client";

import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { BannerForm } from "@/components/admin/forms/BannerForm";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { BANNER_PLACEMENT_LABELS } from "@/lib/banner-labels";
import type { BannerPlacement } from "@prisma/client";

type Row = {
  id: string;
  title: string;
  placement: BannerPlacement;
  order: number;
  isActive: boolean;
  imageUrl: string;
  linkUrl?: string | null;
};

export default function AdminBannersPage() {
  return (
    <AdminEntityPage<Row>
      entity="banners"
      title="Banners"
      description="Carrossel principal, banner vertical na barra esquerda e banner na coluna direita da home."
      FormComponent={BannerForm}
      columns={[
        { key: "img", header: "", cell: (r) => <Thumb src={r.imageUrl} /> },
        { key: "title", header: "Título", cell: (r) => r.title },
        {
          key: "placement",
          header: "Posição",
          cell: (r) => (
            <span className="text-xs text-muted-foreground">
              {BANNER_PLACEMENT_LABELS[r.placement] ?? r.placement}
            </span>
          ),
        },
        { key: "order", header: "Ordem", cell: (r) => r.order },
        {
          key: "active",
          header: "Ativo",
          cell: (r) =>
            r.isActive ? (
              <Badge variant="outline" className="text-neon border-neon/30">
                Ativo
              </Badge>
            ) : (
              <Badge variant="outline">Inativo</Badge>
            ),
        },
      ]}
    />
  );
}
