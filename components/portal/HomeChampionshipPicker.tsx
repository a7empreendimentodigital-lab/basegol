"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  ChampionshipPickerList,
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
    <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14 xl:gap-20">
        <div className="text-left lg:w-[min(100%,22rem)] lg:shrink-0 xl:w-96">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#22c55e]">
            Futebol de base
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight tracking-wide text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Escolha um{" "}
            <span className="text-[#22c55e]">campeonato</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-400">
            Acompanhe os principais campeonatos de futebol de base do Brasil.
          </p>

          <div className="relative mt-8 max-w-md lg:max-w-none">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar campeonato..."
              className="h-12 w-full rounded-lg border border-white/15 bg-black/40 pr-12 pl-4 text-sm text-white placeholder:text-neutral-500 focus:border-[#22c55e]/40 focus:outline-none focus:ring-1 focus:ring-[#22c55e]/25"
            />
            <Search
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 lg:pt-1">
          <ChampionshipPickerList championships={filtered} />
        </div>
      </div>
    </main>
  );
}
