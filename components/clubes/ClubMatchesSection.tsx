"use client";

import { useMemo, useState } from "react";
import { CalendarClock, History, Radio } from "lucide-react";
import { MatchList } from "@/components/matches/MatchList";
import type { ClubPublicMatches } from "@/types";
import { publicEmptyShell, publicSectionDivider } from "@/lib/public-ui-classes";
import { cn } from "@/lib/utils";

type TabId = "upcoming" | "finished" | "live";

const TABS: { id: TabId; label: string; icon: typeof CalendarClock }[] = [
  { id: "upcoming", label: "Próximos", icon: CalendarClock },
  { id: "finished", label: "Resultados", icon: History },
  { id: "live", label: "Ao vivo", icon: Radio },
];

export function ClubMatchesSection({ live, upcoming, finished }: ClubPublicMatches) {
  const defaultTab: TabId = live.length
    ? "live"
    : upcoming.length
      ? "upcoming"
      : "finished";

  const [tab, setTab] = useState<TabId>(defaultTab);

  const counts = useMemo(
    () => ({ live: live.length, upcoming: upcoming.length, finished: finished.length }),
    [live.length, upcoming.length, finished.length]
  );

  const hasAny = counts.live + counts.upcoming + counts.finished > 0;
  if (!hasAny) {
    return (
      <section className={publicEmptyShell}>
        <p className="text-sm text-muted-foreground">
          Nenhum jogo registrado para este clube ainda.
        </p>
      </section>
    );
  }

  const activeMatches =
    tab === "live" ? live : tab === "upcoming" ? upcoming : finished;

  const emptyMessage =
    tab === "live"
      ? "Nenhuma partida ao vivo no momento."
      : tab === "upcoming"
        ? "Nenhum jogo agendado."
        : "Nenhum resultado registrado ainda.";

  return (
    <section className={cn("space-y-5", publicSectionDivider, "pb-8 sm:pb-10")}>
      <h2 className="font-display text-2xl tracking-wide text-foreground">Jogos</h2>

      <nav
        className="flex flex-wrap gap-2"
        aria-label="Filtrar jogos do clube"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = counts[id];
          if (id === "live" && count === 0) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                tab === id
                  ? "border-foreground bg-foreground text-background"
                  : "border-line text-muted-foreground hover:bg-graphite-light hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {label}
              {count > 0 ? (
                <span
                  className={cn(
                    "min-w-[1.25rem] rounded-full px-1 text-center text-[10px] font-bold tabular-nums",
                    tab === id ? "bg-background/20 text-background" : "bg-pitch text-muted-foreground",
                    id === "live" && tab !== id && "text-red-400"
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <MatchList
        matches={activeMatches}
        showFullDate
        layout="stacked"
        emptyMessage={emptyMessage}
        variant={tab === "live" ? "live" : tab === "upcoming" ? "upcoming" : "finished"}
      />
    </section>
  );
}
