"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Radio } from "lucide-react";
import { TeamCrest } from "@/components/matches/TeamCrest";
import { parseApiResponse } from "@/lib/api-client";
import { MATCH_STATUS_LABELS } from "@/lib/admin-labels";
import { cn } from "@/lib/utils";

const TAB_DEFS = [
  { segment: "placar", label: "Placar" },
  { segment: "escalacao", label: "Escalação" },
  { segment: "eventos", label: "Eventos" },
  { segment: "estatisticas", label: "Estatísticas" },
  { segment: "sumula", label: "Súmula" },
] as const;

type LiveSnapshot = {
  status: string;
  homeScore: number;
  awayScore: number;
  minute: number | null;
};

type Props = {
  matchId: string;
  homeName: string;
  awayName: string;
  homeCrest?: string | null;
  awayCrest?: string | null;
  basePath: string;
  backHref: string;
  backLabel: string;
  initial: LiveSnapshot;
};

export function MatchOperationNav({
  matchId,
  homeName,
  awayName,
  homeCrest,
  awayCrest,
  basePath,
  backHref,
  backLabel,
  initial,
}: Props) {
  const pathname = usePathname() ?? "";
  const [live, setLive] = useState(initial);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/matches/${matchId}`);
    if (!res.ok) return;
    const data = await parseApiResponse<LiveSnapshot & { id: string }>(res);
    if (data) {
      setLive({
        status: data.status,
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        minute: data.minute,
      });
    }
  }, [matchId]);

  useEffect(() => {
    const t = setInterval(() => void refresh(), 5000);
    return () => clearInterval(t);
  }, [refresh]);

  const isLive = live.status === "LIVE" || live.status === "HALFTIME";
  const statusLabel = MATCH_STATUS_LABELS[live.status] ?? live.status;

  return (
    <div className="mb-6 space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {backLabel}
      </Link>

      <div className="rounded-2xl border border-line bg-graphite-light overflow-hidden">
        <div className="px-4 sm:px-6 py-5 border-b border-line bg-pitch/30">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Operação da partida
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                isLive
                  ? "bg-neon/20 text-neon border border-neon/40"
                  : live.status === "FINISHED"
                    ? "bg-muted text-muted-foreground border border-line"
                    : "bg-pitch/60 text-foreground border border-line"
              )}
            >
              {isLive ? <Radio className="h-3 w-3 animate-pulse" aria-hidden /> : null}
              {statusLabel}
              {live.minute != null && isLive ? (
                <span className="tabular-nums">· {live.minute}&apos;</span>
              ) : null}
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-8">
            <div className="flex flex-1 flex-col items-center gap-2 min-w-0 text-center">
              <TeamCrest url={homeCrest} name={homeName} size="lg" />
              <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 leading-snug">
                {homeName}
              </p>
            </div>

            <div className="shrink-0 text-center px-2">
              <p className="font-display text-5xl sm:text-6xl tabular-nums text-neon leading-none">
                {live.homeScore}
                <span className="text-muted-foreground mx-1 sm:mx-2">:</span>
                {live.awayScore}
              </p>
            </div>

            <div className="flex flex-1 flex-col items-center gap-2 min-w-0 text-center">
              <TeamCrest url={awayCrest} name={awayName} size="lg" />
              <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 leading-snug">
                {awayName}
              </p>
            </div>
          </div>
        </div>

        <nav
          className="flex gap-1.5 p-3 sm:p-4 overflow-x-auto scrollbar-hide"
          aria-label="Seções da partida"
        >
          {TAB_DEFS.map((tab) => {
            const href = `${basePath}/${tab.segment}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={tab.segment}
                href={href}
                className={cn(
                  "shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-graphite hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
