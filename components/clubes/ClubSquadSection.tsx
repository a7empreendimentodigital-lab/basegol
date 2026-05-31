"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { groupAthletesByCategory, type SquadAthlete } from "@/lib/athlete-category";
import { categoryPillActive, categoryPillBase } from "@/lib/public-ui-classes";
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
      <p className="rounded-xl border border-dashed border-line bg-pitch/20 px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum atleta cadastrado neste clube.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {groups.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar elenco por categoria">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
            className={cn(categoryPillBase, "px-3 py-1.5 text-xs", activeCategory === "all" && categoryPillActive)}
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
                categoryPillBase,
                "px-3 py-1.5 text-xs",
                activeCategory === g.category && categoryPillActive
              )}
            >
              {g.category} ({g.athletes.length})
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-8">
        {visibleGroups.map((group) => (
          <section key={group.category} aria-labelledby={`squad-${group.category}`}>
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-2">
              <h3
                id={`squad-${group.category}`}
                className="flex items-center gap-2 font-display text-xl tracking-wide text-foreground"
              >
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                {group.category}
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {group.athletes.length}{" "}
                {group.athletes.length === 1 ? "atleta" : "atletas"}
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
