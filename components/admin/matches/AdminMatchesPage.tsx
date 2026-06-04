"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentProps } from "react";
import { CalendarDays, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { AdminGroupedListPage } from "@/components/admin/shared/AdminGroupedListPage";
import { AdminListRowActions } from "@/components/admin/shared/AdminListRowActions";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { MatchForm } from "@/components/admin/forms/MatchForm";
import { Select } from "@/components/ui/select";
import { MATCH_STATUS_LABELS } from "@/lib/admin-labels";
import { groupItemsByKey } from "@/lib/admin-list-groups";
import { clubSigla } from "@/lib/club-display";
import { formatRoundLabel } from "@/lib/match-display";
import { formatDate, formatTime } from "@/lib/utils";
import { useAdminOptions } from "@/hooks/use-admin-options";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

type Row = {
  id: string;
  status: string;
  scheduledAt: string;
  round?: number;
  matchNumber?: number | null;
  venue?: string | null;
  homeScore?: number;
  awayScore?: number;
  competitionRound?: { number: number; label: string | null } | null;
  group?: { name: string; category?: { name: string } };
  homeTeam?: { club: { name: string; shortName?: string | null } };
  awayTeam?: { club: { name: string; shortName?: string | null } };
};

function formatAdminRoundLabel(row: Row): string | null {
  const label = row.competitionRound?.label?.trim();
  if (label) return label;
  const n = row.competitionRound?.number ?? row.round;
  if (n != null && n > 0) return formatRoundLabel(n);
  return null;
}

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
  const roundLabel = formatAdminRoundLabel(row);

  const metaParts = [
    formatDate(row.scheduledAt),
    formatTime(row.scheduledAt),
    roundLabel,
    row.group?.name ?? null,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:grid sm:grid-cols-[1fr_auto_5.5rem_auto] sm:gap-4 sm:items-center sm:px-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground leading-snug">
          {home}
          <span className="text-muted-foreground font-normal mx-1.5">×</span>
          {away}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{metaParts.join(" · ")}</p>
        {row.matchNumber != null ? (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">Jogo nº {row.matchNumber}</p>
        ) : null}
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

type PageProps = { championshipId?: string };

export function AdminMatchesPage({ championshipId }: PageProps = {}) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [categoryId, setCategoryId] = useState("");
  const [roundNumber, setRoundNumber] = useState("");
  const [clubId, setClubId] = useState("");
  const [syncingRounds, setSyncingRounds] = useState(false);
  const [purgingMatches, setPurgingMatches] = useState(false);
  const { options: categories } = useAdminOptions("categories", {
    championshipId: championshipId || undefined,
  });
  const { options: championships } = useAdminOptions("championships");
  const { options: clubs } = useAdminOptions("clubs", {
    championshipId: championshipId || undefined,
  });
  const { options: rounds } = useAdminOptions("match-rounds", {
    categoryId: categoryId || undefined,
    championshipId: championshipId || undefined,
  });

  useEffect(() => {
    setRoundNumber("");
  }, [categoryId]);

  const extraParams = useMemo(
    () => ({
      championshipId: championshipId || undefined,
      categoryId: categoryId || undefined,
      roundNumber: roundNumber || undefined,
      clubId: clubId || undefined,
    }),
    [championshipId, categoryId, roundNumber, clubId]
  );

  const buildGroups = useCallback(
    (items: Row[]) =>
      groupItemsByKey(items, (r) => r.group?.category?.name ?? "Sem categoria", {
        sortItems: (a, b) => {
          const roundDiff = (a.round ?? 0) - (b.round ?? 0);
          if (roundDiff !== 0) return roundDiff;
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
        },
      }),
    []
  );

  async function purgeAllMatches() {
    const ok = await confirm({
      title: "Apagar todos os jogos do Paulista?",
      description:
        "Remove somente partidas, placares e histórico de importação de jogos.\n\nOs grupos, clubes inscritos e categorias NÃO serão alterados. Depois você pode importar rodada a rodada pelo PDF.",
      confirmLabel: "Apagar jogos",
      variant: "destructive",
    });
    if (!ok) return;

    const paulista =
      championships.find((c) => /paulista/i.test(c.label)) ?? championships[0];

    setPurgingMatches(true);
    try {
      const res = await fetch("/api/admin/purge-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: true,
          championshipId: paulista?.value,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || "Falha ao apagar jogos");
      }
      const data = json.data as { matchesDeleted: number; championshipName?: string };
      toast({
        title: "Jogos removidos",
        description: `${data.matchesDeleted} partida(s) apagada(s)${data.championshipName ? ` — ${data.championshipName}` : ""}. Grupos e clubes mantidos.`,
        variant: "success",
      });
      window.location.reload();
    } catch (e) {
      toast({
        title: "Erro ao apagar jogos",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setPurgingMatches(false);
    }
  }

  async function fixRoundsFromFpf() {
    setSyncingRounds(true);
    try {
      const res = await fetch("/api/admin/sync-match-rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: categoryId || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: string }).error || "Falha ao corrigir rodadas");
      }
      const data = json.data as { updated: number; alreadyCorrect: number; missingMatch: number };
      toast({
        title: "Rodadas corrigidas",
        description: `${data.updated} jogo(s) atualizado(s) · ${data.alreadyCorrect} já estavam certos${data.missingMatch ? ` · ${data.missingMatch} sem jogo no sistema` : ""}`,
        variant: "success",
      });
      window.location.reload();
    } catch (e) {
      toast({
        title: "Erro ao corrigir rodadas",
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
      });
    } finally {
      setSyncingRounds(false);
    }
  }

  return (
    <AdminGroupedListPage<Row>
      entity="matches"
      title="Jogos"
      description="Agende partidas por categoria, mandante, visitante, local e status."
      searchPlaceholder={
        clubId ? "Buscar local..." : "Buscar clube ou local..."
      }
      emptyMessage="Nenhum jogo encontrado."
      filterAriaLabel="Filtrar por categoria"
      pillAllLabel="Todas"
      sectionIcon={CalendarDays}
      countLabel={(n) => `${n} ${n === 1 ? "partida" : "partidas"}`}
      dialogTitles={{ new: "Nova partida", edit: "Editar partida" }}
      deleteConfirm={() => "Excluir esta partida? Esta ação não pode ser desfeita."}
      extraParams={extraParams}
      FormComponent={
        championshipId
          ? (props: ComponentProps<typeof MatchForm>) => (
              <MatchForm {...props} championshipId={championshipId} />
            )
          : MatchForm
      }
      buildGroups={buildGroups}
      toolbarExtras={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {!championshipId ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={purgingMatches || syncingRounds}
                onClick={() => void purgeAllMatches()}
                className="gap-2 shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {purgingMatches ? "Apagando…" : "Apagar todos os jogos"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={syncingRounds || purgingMatches}
                onClick={() => void fixRoundsFromFpf()}
                className="gap-2 shrink-0"
              >
                <RefreshCw
                  className={`h-4 w-4 ${syncingRounds ? "animate-spin" : ""}`}
                  aria-hidden
                />
                {syncingRounds ? "Corrigindo…" : "Corrigir rodadas (FPF)"}
              </Button>
            </>
          ) : null}
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="min-w-[180px] flex-1 sm:flex-none sm:max-w-[220px]"
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Select
            value={roundNumber}
            onChange={(e) => setRoundNumber(e.target.value)}
            className="min-w-[160px] flex-1 sm:flex-none"
            aria-label="Filtrar por rodada"
          >
            <option value="">Todas as rodadas</option>
            {rounds.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <Select
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            className="min-w-[200px] flex-1 sm:flex-none sm:max-w-[280px]"
            aria-label="Filtrar por clube"
          >
            <option value="">Todos os clubes</option>
            {clubs.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
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
