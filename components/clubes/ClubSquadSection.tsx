"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { groupAthletesByCategory, type SquadAthlete } from "@/lib/athlete-category";
import { categoryPillActive, categoryPillBaseMd, publicEmptyShell, publicSectionDivider } from "@/lib/public-ui-classes";
import { cn } from "@/lib/utils";
import { SquadAthleteCard } from "@/components/clubes/SquadAthleteCard";

type Props = {
  athletes: SquadAthlete[];
  /** Ordem sugerida (ex.: categorias dos grupos do clube). */
  categoryOrder?: string[];
};

export function ClubSquadSection({ athletes, categoryOrder = [] }: Props) {
  const groups = useMemo(
    () => groupAthletesByCategory(athletes, categoryOrder),
    [athletes, categoryOrder]
  );

  const [activeCategory, setActiveCategory] = useState<string | "all">("all");

  const visibleGroups = useMemo(() => {
    if (activeCategory === "all") return groups;
    return groups.filter((g) => g.category === activeCategory);
  }, [groups, activeCategory]);

  if (athletes.length === 0) {
    return (
      <p className={publicEmptyShell}>Nenhum atleta cadastrado neste clube.</p>
    );
  }

  const showPills = groups.length > 1;

  return (
    <div className="space-y-4 sm:space-y-5">
      {showPills ? (
        <div className="-mx-4 sm:mx-0">
          <div
            className="flex gap-2 overflow-x-auto px-4 pb-1 sm:flex-wrap sm:overflow-visible sm:px-0 scrollbar-hide"
            role="tablist"
            aria-label="Filtrar elenco por categoria"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              className={cn(
                categoryPillBaseMd,
                "shrink-0 snap-start px-3.5 py-2",
                activeCategory === "all" && categoryPillActive
              )}
            >
              Todos ({athletes.length})
            </button>
            {groups.map((g) => (
              <button
                key={g.category}
                type="button"
                role="tab"
                aria-selected={activeCategory === g.category}
                onClick={() => setActiveCategory(g.category)}
                className={cn(
                  categoryPillBaseMd,
                  "shrink-0 snap-start px-3.5 py-2",
                  activeCategory === g.category && categoryPillActive
                )}
              >
                {g.category} ({g.athletes.length})
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="divide-y divide-line/60">
        {visibleGroups.map((group) => (
          <section
            key={group.category}
            className={publicSectionDivider}
            aria-labelledby={`squad-${group.category}`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line/60 py-2.5 sm:py-3">
              <h3
                id={`squad-${group.category}`}
                className="flex min-w-0 items-center gap-2 font-display text-base sm:text-xl tracking-wide text-foreground"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neon/10 text-neon sm:h-8 sm:w-8">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </span>
                <span className="truncate">{group.category}</span>
              </h3>
              <span className="shrink-0 rounded-full bg-pitch/60 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground sm:text-xs">
                {group.athletes.length} {group.athletes.length === 1 ? "atleta" : "atletas"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-2 sm:gap-2.5 sm:p-3 lg:grid-cols-3 lg:gap-3">
              {group.athletes.map((a) => (
                <SquadAthleteCard
                  key={a.id}
                  name={`${a.firstName} ${a.lastName}`}
                  position={a.position}
                  photoUrl={a.photoUrl}
                  shirtNumber={a.shirtNumber}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
