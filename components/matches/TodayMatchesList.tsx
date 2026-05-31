"use client";

import { CalendarDays } from "lucide-react";
import type { MatchWithTeams } from "@/types";
import { MatchList } from "@/components/matches/MatchList";
import { HomeSectionLink } from "@/components/home/HomeSectionLink";

export function TodayMatchesSection({ matches }: { matches: MatchWithTeams[] }) {
  if (!matches.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="h-5 w-5 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-2xl tracking-wide text-foreground">Jogos de hoje</h2>
        </div>
        <HomeSectionLink href="/jogos">Ver todos</HomeSectionLink>
      </div>

      <MatchList
        matches={matches}
        showFullDate={false}
        emptyMessage="Nenhum jogo agendado para hoje."
        variant="today"
      />
    </section>
  );
}
