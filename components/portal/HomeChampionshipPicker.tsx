"use client";

import { useMemo, useState } from "react";
import { Search, Trophy } from "lucide-react";
import {
  ChampionshipPickerGrid,
  type ChampionshipPickerItem,
} from "@/components/portal/ChampionshipPickerGrid";

type Props = {
  championships: ChampionshipPickerItem[];
  initialQuery?: string;
};

export function HomeChampionshipPicker({
  championships,
  initialQuery = "",
}: Props) {
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return championships;
    return championships.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.season.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term) ||
        (c.description?.toLowerCase().includes(term) ?? false)
    );
  }, [championships, query]);

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <div className="text-center">
        <Trophy className="mx-auto h-8 w-8 text-[#22c55e]" aria-hidden />
        <h1 className="mt-4 font-display text-3xl tracking-wide text-white sm:text-4xl">
          Escolha um <span className="text-[#22c55e]">campeonato</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-400">
          Acompanhe os principais campeonatos de futebol de base.
        </p>
      </div>

      <div className="relative mx-auto mt-8 max-w-md">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar campeonato..."
          className="h-11 w-full rounded-full border border-white/15 bg-black/50 pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 focus:border-[#22c55e]/50 focus:outline-none focus:ring-1 focus:ring-[#22c55e]/30"
        />
      </div>

      <div className="mt-10">
        <ChampionshipPickerGrid championships={filtered} />
      </div>
    </main>
  );
}
