"use client";

import { useCallback, type ComponentProps } from "react";
import { Layers } from "lucide-react";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { AdminGroupedListPage } from "@/components/admin/shared/AdminGroupedListPage";
import { AdminListRowActions } from "@/components/admin/shared/AdminListRowActions";
import { CategoryForm } from "@/components/admin/forms/CategoryForm";
import { groupItemsByKey } from "@/lib/admin-list-groups";

type Row = {
  id: string;
  name: string;
  championshipId: string;
  ageGroup?: string | null;
  imageUrl?: string | null;
  status?: string;
  gender?: string | null;
  championship?: { id: string; name: string };
};

function CategoryListRow({
  row,
  onEdit,
  onDelete,
}: {
  row: Row;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[auto_1fr_6rem_auto] sm:gap-4 sm:items-center sm:px-4">
      <Thumb src={row.imageUrl} alt={row.name} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground leading-snug">{row.name}</p>
        {row.ageGroup ? (
          <p className="text-xs text-muted-foreground mt-0.5">Faixa {row.ageGroup}</p>
        ) : null}
      </div>
      <p className="hidden sm:block text-sm text-muted-foreground">{row.ageGroup ?? "—"}</p>
      <AdminListRowActions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={`Editar ${row.name}`}
        deleteLabel={`Excluir ${row.name}`}
      />
    </div>
  );
}

type PageProps = { championshipId?: string };

function CategoryFormForChampionship({
  championshipId,
  ...props
}: ComponentProps<typeof CategoryForm> & { championshipId?: string }) {
  const mergedInitial = championshipId
    ? { ...(props.initial ?? {}), championshipId }
    : props.initial;
  return <CategoryForm {...props} initial={mergedInitial} />;
}

export function AdminCategoriesPage({ championshipId }: PageProps = {}) {
  const buildGroups = useCallback(
    (items: Row[]) => {
      if (championshipId) {
        return [{ key: "all", label: "Categorias", items }];
      }
      return groupItemsByKey(items, (r) => r.championship?.name ?? "Sem campeonato", {
        sortItems: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
      });
    },
    [championshipId]
  );

  const Form = championshipId
    ? (props: ComponentProps<typeof CategoryForm>) => (
        <CategoryFormForChampionship {...props} championshipId={championshipId} />
      )
    : CategoryForm;

  return (
    <AdminGroupedListPage<Row>
      entity="categories"
      title={championshipId ? "Categorias do campeonato" : "Categorias"}
      description="Faixas etárias e divisões dentro de cada campeonato."
      extraParams={championshipId ? { championshipId } : undefined}
      searchPlaceholder="Buscar categoria..."
      emptyMessage="Nenhuma categoria encontrada."
      filterAriaLabel="Filtrar por campeonato"
      sectionIcon={Layers}
      countLabel={(n) => `${n} ${n === 1 ? "categoria" : "categorias"}`}
      dialogTitles={{ new: "Nova categoria", edit: "Editar categoria" }}
      deleteConfirm={(r) => `Excluir a categoria "${r.name}"? Esta ação não pode ser desfeita.`}
      FormComponent={Form}
      buildGroups={buildGroups}
      renderDesktopHeader={() => (
        <div className="hidden sm:grid sm:grid-cols-[auto_1fr_6rem_auto] sm:gap-4 sm:items-center px-4 py-2 bg-secondary/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="w-10" />
          <span>Categoria</span>
          <span>Faixa</span>
          <span className="text-right w-[4.5rem]">Ações</span>
        </div>
      )}
      renderRow={({ row, onEdit, onDelete }) => (
        <CategoryListRow row={row} onEdit={onEdit} onDelete={onDelete} />
      )}
    />
  );
}
