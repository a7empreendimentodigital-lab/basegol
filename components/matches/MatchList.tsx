import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarClock, CalendarOff, Hash, History, Radio, Trophy } from "lucide-react";
import type { MatchWithTeams } from "@/types";
import { formatTime } from "@/lib/utils";
import {
  formatLiveClock,
  formatMatchDateShort,
  formatRoundLabel,
} from "@/lib/match-display";
import { TeamCrest } from "@/components/matches/TeamCrest";
import { MatchListRowStacked } from "@/components/matches/MatchListRowStacked";
import { publicEmptyShell, publicListShell } from "@/lib/public-ui-classes";
import { cn } from "@/lib/utils";

function MatchMeta({ match }: { match: MatchWithTeams }) {
  return (
    <div className="min-w-0 space-y-2 text-xs leading-snug">
      {match.categoryName ? (
        <p className="sm:text-right">
          <span className="font-display text-base sm:text-lg font-bold uppercase tracking-wide text-foreground">
            {match.categoryName}
          </span>
        </p>
      ) : null}
      {match.championshipName ? (
        <p className="flex items-center gap-1.5 text-muted-foreground sm:justify-end">
          <Trophy className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          <span className="sm:line-clamp-2">{match.championshipName}</span>
        </p>
      ) : null}
      <p className="flex items-center gap-1.5 text-muted-foreground/90 sm:justify-end">
        <Hash className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
        <span>{formatRoundLabel(match.round)}</span>
      </p>
    </div>
  );
}

type MatchListRowProps = {
  match: MatchWithTeams;
  showFullDate?: boolean;
};

function MatchStatusColumn({
  match,
  isLive,
  isFinished,
  showFullDate,
  clockLabel,
  showClockSubline,
}: {
  match: MatchWithTeams;
  isLive: boolean;
  isFinished: boolean;
  showFullDate: boolean;
  clockLabel: string | null;
  showClockSubline: boolean;
}) {
  if (isFinished) {
    return (
      <div className="flex flex-col gap-1 tabular-nums">
        {showFullDate ? (
          <span className="whitespace-nowrap text-[11px] leading-none text-muted-foreground">
            {formatMatchDateShort(match.scheduledAt)}
          </span>
        ) : null}
        <span className="whitespace-nowrap text-xs font-semibold text-muted-foreground">
          Finalizado
        </span>
      </div>
    );
  }

  if (isLive) {
    return (
      <div className="flex flex-col gap-1 tabular-nums">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-red-400">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
          </span>
          Ao vivo
        </span>
        {showClockSubline ? (
          <span className="text-[11px] text-muted-foreground">{clockLabel}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 tabular-nums">
      {showFullDate ? (
        <span className="whitespace-nowrap text-[11px] leading-none text-muted-foreground">
          {formatMatchDateShort(match.scheduledAt)}
        </span>
      ) : null}
      <span className="whitespace-nowrap text-lg font-semibold leading-none text-foreground sm:text-xl">
        {formatTime(match.scheduledAt)}
      </span>
    </div>
  );
}

function MatchScore({ match, isLive }: { match: MatchWithTeams; isLive: boolean }) {
  const isFinished = match.status === "FINISHED";
  const showScore = isLive || isFinished;
  const homePen = match.homePenaltyScore ?? 0;
  const awayPen = match.awayPenaltyScore ?? 0;
  const hasPenalties = homePen + awayPen > 0;

  if (!showScore) {
    return (
      <span className="inline-flex min-w-[3.75rem] items-center justify-center rounded-md bg-graphite-light px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground sm:text-sm">
        {formatTime(match.scheduledAt)}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-graphite-light px-2.5 py-1 font-display text-xl tabular-nums text-foreground sm:text-2xl">
        {match.homeScore}
        <span className="mx-1 font-sans text-base text-muted-foreground">:</span>
        {match.awayScore}
      </span>
      {hasPenalties && isFinished ? (
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
          Pen. {homePen}:{awayPen}
        </span>
      ) : null}
    </div>
  );
}

export function MatchListRow({ match, showFullDate = false }: MatchListRowProps) {
  const homeName = match.homeTeam.club.shortName ?? match.homeTeam.club.name;
  const awayName = match.awayTeam.club.shortName ?? match.awayTeam.club.name;
  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const isFinished = match.status === "FINISHED";
  const clockLabel = isLive ? formatLiveClock(match.status, match.minute, match) : null;
  const showClockSubline = clockLabel != null && clockLabel !== "Ao vivo";

  const statusColumn = (
    <MatchStatusColumn
      match={match}
      isLive={isLive}
      isFinished={isFinished}
      showFullDate={showFullDate || isFinished}
      clockLabel={clockLabel}
      showClockSubline={showClockSubline}
    />
  );

  return (
    <Link
      href={`/jogos/${match.id}`}
      className={cn(
        "block w-full bg-graphite/30 px-3 py-5 transition-colors hover:bg-graphite/50 sm:px-5 sm:py-5 lg:px-8",
        isLive && "bg-red-500/[0.03] hover:bg-red-500/[0.05]"
      )}
    >
      <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[5rem_minmax(0,1fr)_minmax(9rem,12rem)] sm:items-center sm:gap-x-6 sm:gap-y-3 lg:gap-x-8">
        <div className="sm:hidden">{statusColumn}</div>
        <div className="hidden shrink-0 sm:block">{statusColumn}</div>

        {/* Mobile: brasão + nome simétricos; desktop: layout em linha */}
        <div className="grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-x-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-x-4">
          <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:text-right">
            <TeamCrest url={match.homeTeam.club.crestUrl} name={homeName} size="md" />
            <span
              className="max-w-full text-sm font-semibold leading-snug text-foreground line-clamp-2 sm:text-base"
              title={homeName}
            >
              {homeName}
            </span>
          </div>

          <div className="flex shrink-0 items-center justify-center px-0.5 sm:px-2">
            <MatchScore match={match} isLive={isLive} />
          </div>

          <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
            <TeamCrest url={match.awayTeam.club.crestUrl} name={awayName} size="md" />
            <span
              className="max-w-full text-sm font-semibold leading-snug text-foreground line-clamp-2 sm:text-base"
              title={awayName}
            >
              {awayName}
            </span>
          </div>
        </div>

        <div className="min-w-0 border-t border-line/40 pt-3 sm:border-0 sm:pt-0">
          <MatchMeta match={match} />
        </div>
      </div>
    </Link>
  );
}

function MatchListEmpty({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  return (
    <div className={publicEmptyShell}>
      <Icon className="mb-2 h-7 w-7 text-muted-foreground/45" strokeWidth={1.25} aria-hidden />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

type MatchListLayout = "default" | "stacked";

type MatchListProps = {
  matches: MatchWithTeams[];
  showFullDate?: boolean;
  emptyMessage?: string;
  variant?: "live" | "upcoming" | "today" | "finished";
  /** Layout empilhado — melhor leitura em detalhe do clube */
  layout?: MatchListLayout;
};

type MatchListGroup = {
  key: string;
  categoryName: string;
  championshipName: string | null;
  items: MatchWithTeams[];
};

function groupMatchesByCategory(matches: MatchWithTeams[]): MatchListGroup[] {
  const grouped = new Map<string, MatchListGroup>();
  for (const match of matches) {
    const categoryName = (match.categoryName ?? "Sem categoria").trim();
    const championshipName = match.championshipName ?? null;
    const key = `${categoryName}::${championshipName ?? ""}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.items.push(match);
      continue;
    }
    grouped.set(key, {
      key,
      categoryName,
      championshipName,
      items: [match],
    });
  }
  return [...grouped.values()];
}

export function MatchList({
  matches,
  showFullDate = false,
  emptyMessage = "Nenhum jogo encontrado.",
  variant = "today",
  layout = "default",
}: MatchListProps) {
  if (matches.length === 0) {
    const emptyIcon =
      variant === "live"
        ? Radio
        : variant === "upcoming"
          ? CalendarClock
          : variant === "finished"
            ? History
            : CalendarOff;
    return <MatchListEmpty icon={emptyIcon} message={emptyMessage} />;
  }

  const Row = layout === "stacked" ? MatchListRowStacked : MatchListRow;
  const groupByCategory = variant === "today" || variant === "upcoming";
  const groups = groupByCategory ? groupMatchesByCategory(matches) : [];

  return (
    <div className={publicListShell}>
      {groupByCategory ? (
        groups.map((group, groupIdx) => (
          <section key={group.key} className={groupIdx > 0 ? "border-t border-line/60" : undefined}>
            <header className="px-3 py-3 sm:px-5 sm:py-3.5 lg:px-8">
              <p className="font-display text-base font-bold uppercase tracking-wide text-foreground sm:text-lg">
                {group.categoryName}
              </p>
              {group.championshipName ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{group.championshipName}</p>
              ) : null}
            </header>
            <div>
              {group.items.map((m) => (
                <Row key={m.id} match={m} showFullDate={showFullDate} />
              ))}
            </div>
          </section>
        ))
      ) : (
        matches.map((m) => <Row key={m.id} match={m} showFullDate={showFullDate} />)
      )}
    </div>
  );
}
