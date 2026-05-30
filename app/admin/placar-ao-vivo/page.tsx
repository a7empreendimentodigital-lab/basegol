"use client";

import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronRight, Radio, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { parseApiResponse } from "@/lib/api-client";
import { MATCH_STATUS_LABELS } from "@/lib/admin-labels";
import { formatDate, formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

type MatchItem = {
  id: string;
  status: string;
  minute: number | null;
  homeScore: number;
  awayScore: number;
  scheduledAt: string;
  homeTeam: { club: { name: string; crestUrl?: string | null } };
  awayTeam: { club: { name: string; crestUrl?: string | null } };
};

type FilterKey = "all" | "live" | "scheduled" | "finished";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "live", label: "Ao vivo" },
  { key: "scheduled", label: "Agendadas" },
  { key: "finished", label: "Encerradas" },
];

export default function AdminPlacarAoVivoPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    void fetch("/api/admin/crud/matches?page=1&pageSize=50")
      .then(async (r) => {
        if (!r.ok) return { items: [] };
        return parseApiResponse<{ items: MatchItem[] }>(r);
      })
      .then((d) => setMatches(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = matches;
    if (filter === "live") {
      list = list.filter((m) => m.status === "LIVE" || m.status === "HALFTIME");
    } else if (filter === "scheduled") {
      list = list.filter((m) => m.status === "SCHEDULED");
    } else if (filter === "finished") {
      list = list.filter((m) => m.status === "FINISHED");
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.homeTeam.club.name.toLowerCase().includes(q) ||
          m.awayTeam.club.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [matches, filter, search]);

  const liveCount = matches.filter((m) => m.status === "LIVE" || m.status === "HALFTIME").length;

  return (
    <div>
      <AdminPageHeader
        title="Placar ao vivo"
        description="Escolha a partida, monte a escalação e opere gols, cartões e cronômetro em tempo real."
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por clube…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors border",
                filter === f.key
                  ? "bg-foreground text-background border-foreground"
                  : "border-line text-muted-foreground hover:text-foreground hover:bg-graphite-light"
              )}
            >
              {f.label}
              {f.key === "live" && liveCount > 0 ? (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-neon text-[10px] font-bold text-background px-1">
                  {liveCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl border border-line bg-graphite-light animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center">
          <p className="text-muted-foreground">Nenhuma partida encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const isLive = m.status === "LIVE" || m.status === "HALFTIME";
            return (
              <article
                key={m.id}
                className={cn(
                  "rounded-2xl border bg-graphite-light overflow-hidden transition-colors",
                  isLive ? "border-neon/40 shadow-[0_0_0_1px_rgba(34,197,94,0.15)]" : "border-line"
                )}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(m.scheduledAt)} · {formatTime(m.scheduledAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={m.status}
                        label={MATCH_STATUS_LABELS[m.status] ?? m.status}
                      />
                      {isLive && m.minute != null ? (
                        <span className="text-xs font-semibold text-neon flex items-center gap-1 tabular-nums">
                          <Radio className="h-3 w-3 animate-pulse" />
                          {m.minute}&apos;
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="flex flex-1 items-center gap-3 min-w-0">
                      {m.homeTeam.club.crestUrl ? (
                        <div className="relative h-10 w-10 shrink-0">
                          <SafeImage
                            src={m.homeTeam.club.crestUrl}
                            alt=""
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-pitch" />
                      )}
                      <p className="text-sm font-medium leading-snug line-clamp-2">
                        {m.homeTeam.club.name}
                      </p>
                    </div>

                    <div className="shrink-0 text-center px-2">
                      <p className="font-display text-4xl sm:text-5xl tabular-nums text-neon leading-none">
                        {m.homeScore}
                        <span className="text-muted-foreground mx-1">:</span>
                        {m.awayScore}
                      </p>
                    </div>

                    <div className="flex flex-1 items-center gap-3 min-w-0 sm:flex-row-reverse sm:text-right">
                      {m.awayTeam.club.crestUrl ? (
                        <div className="relative h-10 w-10 shrink-0">
                          <SafeImage
                            src={m.awayTeam.club.crestUrl}
                            alt=""
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-pitch" />
                      )}
                      <p className="text-sm font-medium leading-snug line-clamp-2">
                        {m.awayTeam.club.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-line">
                    <Button asChild size="sm" className="flex-1 sm:flex-none min-w-[120px]">
                      <Link href={`/admin/partida/${m.id}/placar`}>
                        Operar partida
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/partida/${m.id}/escalacao`}>Escalação</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/partida/${m.id}/sumula`}>Súmula</Link>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
