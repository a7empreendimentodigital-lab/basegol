"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import {
  LiveMatchAdminCard,
  type LiveMatchAdminCardData,
} from "@/components/admin/placar-ao-vivo/LiveMatchAdminCard";
import { parseApiResponse } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "live" | "scheduled" | "finished";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "live", label: "Ao vivo" },
  { key: "scheduled", label: "Agendadas" },
  { key: "finished", label: "Encerradas" },
];

function matchSearchText(m: LiveMatchAdminCardData): string {
  const parts = [
    m.homeTeam.club.name,
    m.awayTeam.club.name,
    m.homeTeam.club.shortName,
    m.awayTeam.club.shortName,
    m.group?.category?.name,
    m.group?.category?.championship?.name,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export default function AdminPlacarAoVivoPage() {
  const [matches, setMatches] = useState<LiveMatchAdminCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const loadMatches = useCallback(() => {
    setLoading(true);
    return fetch("/api/admin/crud/matches?page=1&pageSize=100", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return { items: [] as LiveMatchAdminCardData[] };
        return parseApiResponse<{ items: LiveMatchAdminCardData[] }>(r);
      })
      .then((d) => setMatches(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadMatches();
    const interval = setInterval(() => void loadMatches(), 8000);
    const onFocus = () => void loadMatches();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadMatches]);

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
      list = list.filter((m) => matchSearchText(m).includes(q));
    }
    return list;
  }, [matches, filter, search]);

  const liveCount = matches.filter((m) => m.status === "LIVE" || m.status === "HALFTIME").length;

  return (
    <div className="max-w-4xl mx-auto w-full">
      <AdminPageHeader
        title="Placar ao vivo"
        description="Escolha a partida, monte a escalação e opere gols, cartões e cronômetro em tempo real."
      />

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por clube ou sigla…"
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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-line bg-graphite-light animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center">
          <p className="text-muted-foreground">Nenhuma partida encontrada.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((m) => (
            <LiveMatchAdminCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
