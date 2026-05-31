"use client";

import Link from "next/link";
import { Calendar, ChevronRight, Radio } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { MATCH_STATUS_LABELS } from "@/lib/admin-labels";
import { clubSigla } from "@/lib/club-display";
import { formatDate, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type LiveMatchAdminCardData = {
  id: string;
  status: string;
  minute: number | null;
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  scheduledAt: string;
  homeTeam: {
    club: { name: string; shortName?: string | null; crestUrl?: string | null };
  };
  awayTeam: {
    club: { name: string; shortName?: string | null; crestUrl?: string | null };
  };
  group?: {
    category?: {
      name: string;
      imageUrl?: string | null;
      championship?: { name: string } | null;
    } | null;
  } | null;
};

function TeamBlock({
  crestUrl,
  name,
  shortName,
  align,
}: {
  crestUrl?: string | null;
  name: string;
  shortName?: string | null;
  align: "left" | "right";
}) {
  const sigla = clubSigla(shortName, name);
  const isRight = align === "right";

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center gap-2 text-center",
        "sm:flex-1 sm:flex-row sm:items-center sm:gap-3 sm:text-left",
        isRight && "sm:flex-row-reverse sm:text-right"
      )}
      title={name}
    >
      <div className="relative h-9 w-9 sm:h-12 sm:w-12 shrink-0">
        {crestUrl ? (
          <SafeImage src={crestUrl} alt={sigla} fill className="object-contain" sizes="48px" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-muted-foreground">
            {sigla.slice(0, 3)}
          </span>
        )}
      </div>
      <div className="min-w-0 w-full sm:flex-1">
        <p className="font-display text-[11px] sm:text-xl font-bold tracking-wide text-foreground leading-tight line-clamp-1">
          {sigla}
        </p>
        <p className="hidden sm:block text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{name}</p>
      </div>
    </div>
  );
}

export function LiveMatchAdminCard({ match }: { match: LiveMatchAdminCardData }) {
  const isLive = match.status === "LIVE" || match.status === "HALFTIME";
  const categoryName = match.group?.category?.name ?? null;
  const categoryImageUrl = match.group?.category?.imageUrl ?? null;
  const championshipName = match.group?.category?.championship?.name ?? null;
  const homePen = match.homePenaltyScore ?? 0;
  const awayPen = match.awayPenaltyScore ?? 0;
  const hasPenalties = homePen + awayPen > 0;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-graphite-light transition-shadow",
        isLive
          ? "border-neon/50 shadow-[0_0_24px_-8px_rgba(34,197,94,0.35)]"
          : "border-line hover:border-line/80 hover:shadow-md"
      )}
    >
      {categoryName ? (
        <div className="flex items-center justify-between gap-3 border-b border-line bg-pitch/35 px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            {categoryImageUrl ? (
              <span className="relative block h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-line/60">
                <SafeImage
                  src={categoryImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </span>
            ) : null}
            <div className="min-w-0">
              <p className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide text-foreground leading-tight">
                {categoryName}
              </p>
              {championshipName ? (
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate mt-0.5 max-w-[10rem] sm:max-w-xs">
                  {championshipName}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isLive && match.minute != null ? (
              <span className="text-xs font-semibold text-neon flex items-center gap-1 tabular-nums">
                <Radio className="h-3 w-3 animate-pulse" aria-hidden />
                {match.minute}&apos;
              </span>
            ) : null}
            <StatusBadge
              status={match.status}
              label={MATCH_STATUS_LABELS[match.status] ?? match.status}
            />
          </div>
        </div>
      ) : null}

      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            {formatDate(match.scheduledAt)} · {formatTime(match.scheduledAt)}
          </p>
          {!categoryName ? (
            <div className="flex items-center gap-2">
              {isLive && match.minute != null ? (
                <span className="text-xs font-semibold text-neon flex items-center gap-1 tabular-nums">
                  <Radio className="h-3 w-3 animate-pulse" aria-hidden />
                  {match.minute}&apos;
                </span>
              ) : null}
              <StatusBadge
                status={match.status}
                label={MATCH_STATUS_LABELS[match.status] ?? match.status}
              />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(7.5rem,auto)_minmax(0,1fr)] items-center gap-3 sm:gap-6">
          <TeamBlock
            crestUrl={match.homeTeam.club.crestUrl}
            name={match.homeTeam.club.name}
            shortName={match.homeTeam.club.shortName}
            align="left"
          />

          <div className="flex flex-col items-center justify-center sm:px-3">
            <div className="w-full min-w-[7.5rem] rounded-xl bg-pitch/55 px-3 py-2.5 sm:px-6 sm:py-4 text-center">
              {hasPenalties ? (
                <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Regulamentar
                </p>
              ) : null}
              <p className="font-display text-[1.65rem] sm:text-4xl tabular-nums text-neon leading-none whitespace-nowrap">
                {match.homeScore}
                <span className="mx-1 sm:mx-1.5 text-muted-foreground font-sans font-normal text-xl sm:text-3xl">
                  :
                </span>
                {match.awayScore}
              </p>
              {hasPenalties ? (
                <div className="mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 border-t border-line/60">
                  <p className="text-[9px] sm:text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    Pênaltis
                  </p>
                  <p className="font-display text-lg sm:text-xl tabular-nums text-foreground leading-none whitespace-nowrap">
                    {homePen}
                    <span className="mx-1 text-muted-foreground">:</span>
                    {awayPen}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <TeamBlock
            crestUrl={match.awayTeam.club.crestUrl}
            name={match.awayTeam.club.name}
            shortName={match.awayTeam.club.shortName}
            align="right"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap pt-1 border-t border-line/80">
          <Button asChild size="sm" className="w-full sm:w-auto sm:min-w-[140px] bg-neon hover:bg-neon/90 text-background font-semibold">
            <Link href={`/admin/partida/${match.id}/placar`}>
              Operar partida
              <ChevronRight className="h-4 w-4 ml-1" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
            <Link href={`/admin/partida/${match.id}/escalacao`}>Escalação</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
            <Link href={`/admin/partida/${match.id}/sumula`}>Súmula</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
