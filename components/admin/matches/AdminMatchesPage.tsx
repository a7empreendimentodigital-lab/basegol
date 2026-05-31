"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { AdminGroupedListPage } from "@/components/admin/shared/AdminGroupedListPage";
import { AdminListRowActions } from "@/components/admin/shared/AdminListRowActions";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { MatchForm } from "@/components/admin/forms/MatchForm";
import { Select } from "@/components/ui/select";
import { MATCH_STATUS_LABELS } from "@/lib/admin-labels";
import { groupItemsByKey } from "@/lib/admin-list-groups";
import { clubSigla } from "@/lib/club-display";
import { formatDate, formatTime } from "@/lib/utils";
import { useAdminOptions } from "@/hooks/use-admin-options";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

type Row = {
  id: string;
  status: string;
  scheduledAt: string;
  venue?: string | null;
  homeScore?: number;
  awayScore?: number;
  group?: { name: string; category?: { name: string } };
  homeTeam?: { club: { name: string; shortName?: string | null } };
  awayTeam?: { club: { name: string; shortName?: string | null } };
};

function MatchListRow({
  row,
  onEdit,
  onDelete,
}: {
  row: Row;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const home = row.homeTeam?.club
    ? clubSigla(row.homeTeam.club.shortName, row.homeTeam.club.name)
    : "?";
  const away = row.awayTeam?.club
    ? clubSigla(row.awayTeam.club.shortName, row.awayTeam.club.name)
    : "?";
  const isFinished = row.status === "FINISHED";
  const isLive = row.status === "LIVE" || row.status === "HALFTIME";
  const showScore = isFinished || isLive;

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[1fr_auto_5.5rem_auto] sm:gap-4 sm:items-center sm:px-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground leading-snug">
          {home}
          <span className="text-muted-foreground font-normal mx-1.5">×</span>
          {away}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(row.scheduledAt)} · {formatTime(row.scheduledAt)}
          {row.group?.name ? ` · ${row.group.name}` : ""}
        </p>
        {row.venue ? (
          <p className="text-xs text-muted-foreground/80 truncate mt-0.5">{row.venue}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
          {showScore ? (
            <span className="font-display text-lg tabular-nums">
              {row.homeScore ?? 0}:{row.awayScore ?? 0}
            </span>
          ) : null}
          <StatusBadge status={row.status} label={MATCH_STATUS_LABELS[row.status] ?? row.status} />
        </div>
      </div>

      {showScore ? (
        <p className="hidden sm:block font-display text-xl tabular-nums text-foreground shrink-0">
          {row.homeScore ?? 0}
          <span className="mx-1 text-muted-foreground font-sans text-base">:</span>
          {row.awayScore ?? 0}
        </p>
      ) : (
        <span className="hidden sm:block text-sm text-muted-foreground shrink-0">—</span>
      )}

      <div className="hidden sm:block shrink-0">
        <StatusBadge status={row.status} label={MATCH_STATUS_LABELS[row.status] ?? row.status} />
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:justify-self-end">
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href={`/admin/partida/${row.id}`} aria-label="Operar partida">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        <AdminListRowActions
          onEdit={onEdit}
          onDelete={onDelete}
          editLabel="Editar partida"
          deleteLabel="Excluir partida"
        />
      </div>
    </div>
  );
}

export function AdminMatchesPage() {
  const [categoryId, setCategoryId] = useState("");
  const { options: categories } = useAdminOptions("categories");
  const extraParams = useMemo(
    () => ({ categoryId: categoryId || undefined }),
    [categoryId]
  );

  const buildGroups = useCallback(
    (items: Row[]) =>
      groupItemsByKey(items, (r) => r.group?.category?.name ?? "Sem categoria", {
        sortItems: (a, b) =>
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      }),
    []
  );

  return (
    <AdminGroupedListPage<Row>
      entity="matches"
      title="Jogos"
      description="Agende partidas por categoria, mandante, visitante, local e status."
      searchPlaceholder="Buscar clube ou local..."
      emptyMessage="Nenhum jogo encontrado."
      filterAriaLabel="Filtrar por categoria"
      pillAllLabel="Todas"
      sectionIcon={CalendarDays}
      countLabel={(n) => `${n} ${n === 1 ? "partida" : "partidas"}`}
      dialogTitles={{ new: "Nova partida", edit: "Editar partida" }}
      deleteConfirm={() => "Excluir esta partida? Esta ação não pode ser desfeita."}
      extraParams={extraParams}
      FormComponent={MatchForm}
      buildGroups={buildGroups}
      toolbarExtras={
        <Select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="min-w-[200px]"
          aria-label="Filtrar por categoria"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      }
      renderDesktopHeader={() => (
        <div className="hidden sm:grid sm:grid-cols-[1fr_auto_5.5rem_auto] sm:gap-4 sm:items-center px-4 py-2 bg-secondary/30 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span>Partida / Data</span>
          <span>Placar</span>
          <span>Status</span>
          <span className="text-right w-[5.5rem]">Ações</span>
        </div>
      )}
      renderRow={({ row, onEdit, onDelete }) => (
        <MatchListRow row={row} onEdit={onEdit} onDelete={onDelete} />
      )}
    />
  );
}
