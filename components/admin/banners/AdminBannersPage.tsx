"use client";

import { useCallback } from "react";
import { Image } from "lucide-react";
import type { BannerPlacement } from "@prisma/client";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { AdminGroupedListPage } from "@/components/admin/shared/AdminGroupedListPage";
import { AdminListRowActions } from "@/components/admin/shared/AdminListRowActions";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { BannerForm } from "@/components/admin/forms/BannerForm";
import { BANNER_PLACEMENT_LABELS } from "@/lib/banner-labels";
import { groupItemsByKey, sortKeysByOrder, type ListGroup } from "@/lib/admin-list-groups";

type Row = {
  id: string;
  title: string;
  placement: BannerPlacement;
  order: number;
  isActive: boolean;
  imageUrl: string;
  linkUrl?: string | null;
};

const PLACEMENT_ORDER: BannerPlacement[] = ["HERO_CAROUSEL", "SIDEBAR_LEFT", "SIDEBAR_RIGHT"];

function buildBannerGroups(items: Row[]): ListGroup<Row>[] {
  return groupItemsByKey(items, (r) => r.placement, {
    getLabel: (key) => BANNER_PLACEMENT_LABELS[key as BannerPlacement] ?? key,
    sortKeys: (keys) => sortKeysByOrder(keys, PLACEMENT_ORDER),
    sortItems: (a, b) => a.order - b.order || a.title.localeCompare(b.title, "pt-BR"),
  });
}

function BannerListRow({
  row,
  onEdit,
  onDelete,
}: {
  row: Row;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[auto_1fr_5rem_5.5rem_auto] sm:gap-4 sm:items-center sm:px-4">
      <Thumb src={row.imageUrl} alt={row.title} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground leading-snug line-clamp-1">{row.title}</p>
        {row.linkUrl ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5" title={row.linkUrl}>
            {row.linkUrl}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">Sem link</p>
        )}
        <p className="text-xs text-muted-foreground mt-1 sm:hidden tabular-nums">
          Ordem {row.order}
        </p>
      </div>
      <p className="hidden sm:block text-sm text-muted-foreground tabular-nums text-right">
        {row.order}
      </p>
      <div className="shrink-0 sm:justify-self-start">
        <StatusBadge
          status={row.isActive ? "ACTIVE" : "INACTIVE"}
          label={row.isActive ? "Ativo" : "Inativo"}
        />
      </div>
      <AdminListRowActions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={`Editar ${row.title}`}
        deleteLabel={`Excluir ${row.title}`}
      />
    </div>
  );
}

export function AdminBannersPage() {
  const buildGroups = useCallback((items: Row[]) => buildBannerGroups(items), []);

  return (
    <AdminGroupedListPage<Row>
      entity="banners"
      title="Banners e patrocínios"
      description="Carrossel da home, barras laterais e anúncios com imagem, link e período de exibição."
      searchPlaceholder="Buscar banner..."
      emptyMessage="Nenhum banner cadastrado."
      filterAriaLabel="Filtrar por posição"
      pillAllLabel="Todas as posições"
      sectionIcon={Image}
      countLabel={(n) => `${n} ${n === 1 ? "banner" : "banners"}`}
      dialogTitles={{ new: "Novo banner", edit: "Editar banner" }}
      deleteConfirm={(r) => `Excluir o banner "${r.title}"? Esta ação não pode ser desfeita.`}
      FormComponent={BannerForm}
      buildGroups={buildGroups}
      renderDesktopHeader={() => (
        <div className="hidden sm:grid sm:grid-cols-[auto_1fr_5rem_5.5rem_auto] sm:gap-4 sm:items-center px-4 py-2 bg-secondary/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="w-10" />
          <span>Banner / Link</span>
          <span className="text-right">Ordem</span>
          <span>Status</span>
          <span className="text-right w-[4.5rem]">Ações</span>
        </div>
      )}
      renderRow={({ row, onEdit, onDelete }) => (
        <BannerListRow row={row} onEdit={onEdit} onDelete={onDelete} />
      )}
    />
  );
}
