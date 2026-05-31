"use client";

import { useCallback } from "react";
import { Newspaper } from "lucide-react";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { AdminGroupedListPage } from "@/components/admin/shared/AdminGroupedListPage";
import { AdminListRowActions } from "@/components/admin/shared/AdminListRowActions";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { NewsForm } from "@/components/admin/forms/NewsForm";
import { groupItemsByKey } from "@/lib/admin-list-groups";
import { formatDate } from "@/lib/utils";

type Row = {
  id: string;
  title: string;
  category?: string | null;
  isFeatured: boolean;
  publishedAt?: string | null;
  imageUrl?: string | null;
};

function buildNewsGroups(items: Row[]) {
  return groupItemsByKey(items, (r) => r.category?.trim() || "Sem categoria", {
    sortItems: (a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return db - da || a.title.localeCompare(b.title, "pt-BR");
    },
  });
}

function NewsListRow({
  row,
  onEdit,
  onDelete,
}: {
  row: Row;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const published = row.publishedAt ? formatDate(row.publishedAt) : "Rascunho";

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[auto_1fr_6.5rem_5.5rem_auto] sm:gap-4 sm:items-center sm:px-4">
      <Thumb src={row.imageUrl} alt={row.title} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground leading-snug line-clamp-2">{row.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">{published}</p>
        {row.isFeatured ? (
          <p className="text-[10px] font-medium text-neon mt-1">Destaque</p>
        ) : null}
      </div>
      <p className="hidden sm:block text-xs text-muted-foreground text-right">{published}</p>
      <div className="shrink-0 sm:justify-self-start">
        <StatusBadge
          status={row.publishedAt ? "ACTIVE" : "DRAFT"}
          label={row.publishedAt ? "Publicada" : "Rascunho"}
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

export function AdminNewsPage() {
  const buildGroups = useCallback((items: Row[]) => buildNewsGroups(items), []);

  return (
    <AdminGroupedListPage<Row>
      entity="news"
      title="Notícias"
      description="Publicações, destaques e capa das matérias."
      searchPlaceholder="Buscar notícia..."
      emptyMessage="Nenhuma notícia encontrada."
      filterAriaLabel="Filtrar por categoria"
      pillAllLabel="Todas"
      sectionIcon={Newspaper}
      countLabel={(n) => `${n} ${n === 1 ? "notícia" : "notícias"}`}
      dialogTitles={{ new: "Nova notícia", edit: "Editar notícia" }}
      deleteConfirm={(r) => `Excluir "${r.title}"? Esta ação não pode ser desfeita.`}
      FormComponent={NewsForm}
      buildGroups={buildGroups}
      renderDesktopHeader={() => (
        <div className="hidden sm:grid sm:grid-cols-[auto_1fr_6.5rem_5.5rem_auto] sm:gap-4 sm:items-center px-4 py-2 bg-secondary/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="w-10" />
          <span>Título</span>
          <span className="text-right">Publicação</span>
          <span>Status</span>
          <span className="text-right w-[4.5rem]">Ações</span>
        </div>
      )}
      renderRow={({ row, onEdit, onDelete }) => (
        <NewsListRow row={row} onEdit={onEdit} onDelete={onDelete} />
      )}
    />
  );
}
