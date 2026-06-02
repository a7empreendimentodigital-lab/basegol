"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { PortalEntryHeader } from "@/components/portal/PortalEntryHeader";
import { PortalEntryFooter } from "@/components/portal/PortalEntryFooter";
import {
  ChampionshipPickerGrid,
  type ChampionshipPickerItem,
} from "@/components/portal/ChampionshipPickerGrid";

type Props = {
  championships: ChampionshipPickerItem[];
  initialQuery?: string;
};

export function HomeChampionshipPicker({ championships, initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return championships;
    return championships.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.season.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term)
    );
  }, [championships, query]);

  return (
    <div className="relative flex min-h-screen flex-col bg-pitch text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.08),transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-pitch/40 via-pitch/85 to-pitch"
        aria-hidden
      />

      <PortalEntryHeader
        activePath="/"
        onSearch={(q) => setQuery(q)}
      />

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="text-center">
          <Trophy className="mx-auto h-8 w-8 text-primary/80" aria-hidden />
          <h1 className="mt-4 font-display text-3xl tracking-wide text-foreground sm:text-4xl">
            Escolha um <span className="text-primary">campeonato</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Acompanhe os principais campeonatos de futebol de base.
          </p>
        </div>

        <div className="mt-10">
          <ChampionshipPickerGrid championships={filtered} />
        </div>
      </main>

      <PortalEntryFooter />
    </div>
  );
}
