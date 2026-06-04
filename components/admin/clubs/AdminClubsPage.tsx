"use client";

import { useCallback, useState } from "react";
import { RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toaster";
import { Thumb } from "@/components/admin/shared/AdminDataTable";
import { AdminGroupedListPage } from "@/components/admin/shared/AdminGroupedListPage";
import { AdminListRowActions } from "@/components/admin/shared/AdminListRowActions";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { ClubForm } from "@/components/admin/forms/ClubForm";
import { CLUB_STATUS_LABELS } from "@/lib/admin-labels";
import { groupItemsByKey, sortKeysByOrder } from "@/lib/admin-list-groups";
import { clubSigla } from "@/lib/club-display";

type Row = {
  id: string;
  name: string;
  shortName?: string | null;
  city?: string | null;
  state?: string;
  status: string;
  crestUrl?: string | null;
};

const STATUS_ORDER = ["APPROVED", "PENDING", "SUSPENDED", "REJECTED"];

function ClubListRow({
  row,
  onEdit,
  onDelete,
}: {
  row: Row;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sigla = clubSigla(row.shortName, row.name);
  const location = `${row.city ?? "—"} / ${row.state ?? "SP"}`;

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[auto_1fr_8rem_5.5rem_auto] sm:gap-4 sm:items-center sm:px-4">
      <Thumb src={row.crestUrl} alt={sigla} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground leading-snug">{sigla}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5" title={row.name}>
          {row.name}
        </p>
        <p className="text-xs text-muted-foreground mt-1 sm:hidden">{location}</p>
      </div>
      <p className="hidden sm:block text-sm text-muted-foreground">{location}</p>
      <div className="shrink-0 sm:justify-self-start">
        <StatusBadge status={row.status} label={CLUB_STATUS_LABELS[row.status] ?? row.status} />
      </div>
      <AdminListRowActions
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={`Editar ${sigla}`}
        deleteLabel={`Excluir ${sigla}`}
      />
    </div>
  );
}

type PageProps = { championshipId?: string };

export function AdminClubsPage({ championshipId }: PageProps = {}) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [syncing, setSyncing] = useState(false);

  async function syncFpfClubs() {
    const ok = await confirm({
      title: "Completar lista FPF?",
      description:
        "Cadastra ou corrige clubes para atingir os 79 participantes oficiais (Sub-11/Sub-12). Clubes já existentes com sigla correta serão atualizados, não duplicados.",
      confirmLabel: "Sincronizar clubes",
    });
    if (!ok) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sync-fpf-clubs", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || "Falha na sincronização");
      }
      const data = json.data as {
        clubs: {
          beforeCount: number;
          afterCount: number;
          created: number;
          updated: number;
          stillMissing: string[];
          officialTotal: number;
        };
      };
      const c = data.clubs;
      toast({
        title: "Clubes sincronizados",
        description: `${c.afterCount} no cadastro · ${c.created} criados · ${c.updated} corrigidos${c.stillMissing.length ? ` · ${c.stillMissing.length} pendente(s)` : ""}`,
        variant: c.stillMissing.length ? "error" : "success",
      });
      window.location.reload();
    } catch (e) {
      toast({
        title: "Erro ao sincronizar clubes",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setSyncing(false);
    }
  }

  const buildGroups = useCallback(
    (items: Row[]) =>
      groupItemsByKey(items, (r) => r.status, {
        getLabel: (k) => CLUB_STATUS_LABELS[k] ?? k,
        sortKeys: (keys) => sortKeysByOrder(keys, STATUS_ORDER),
        sortItems: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
      }),
    []
  );

  return (
    <AdminGroupedListPage<Row>
      entity="clubs"
      title="Clubes"
      description={
        championshipId
          ? "Clubes inscritos neste campeonato (via grupos). Crie categorias e grupos antes de vincular clubes."
          : "Cadastro de clubes, escudos, banners e status de aprovação."
      }
      pageSize={120}
      extraParams={championshipId ? { championshipId } : undefined}
      toolbarExtras={
        championshipId ? null : (
          <Button
            type="button"
            variant="outline"
            disabled={syncing}
            onClick={() => void syncFpfClubs()}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} aria-hidden />
            {syncing ? "Sincronizando…" : "Completar lista FPF (79)"}
          </Button>
        )
      }
      searchPlaceholder="Buscar clube..."
      emptyMessage="Nenhum clube encontrado."
      filterAriaLabel="Filtrar por status"
      sectionIcon={Shield}
      countLabel={(n) => `${n} ${n === 1 ? "clube" : "clubes"}`}
      dialogTitles={{ new: "Novo clube", edit: "Editar clube" }}
      deleteConfirm={(r) => `Excluir o clube "${r.name}"? Esta ação não pode ser desfeita.`}
      FormComponent={ClubForm}
      buildGroups={buildGroups}
      renderDesktopHeader={() => (
        <div className="hidden sm:grid sm:grid-cols-[auto_1fr_8rem_5.5rem_auto] sm:gap-4 sm:items-center px-4 py-2 bg-secondary/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="w-10" />
          <span>Clube</span>
          <span>Cidade / UF</span>
          <span>Status</span>
          <span className="text-right w-[4.5rem]">Ações</span>
        </div>
      )}
      renderRow={({ row, onEdit, onDelete }) => (
        <ClubListRow row={row} onEdit={onEdit} onDelete={onDelete} />
      )}
    />
  );
}
