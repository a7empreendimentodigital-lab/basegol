"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Layers, ListOrdered, Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChampionshipEmptyPanel } from "@/components/campeonatos/ChampionshipEmptyPanel";
import { StandingTable } from "@/components/matches/StandingTable";
import {
  categoryPillActive,
  categoryPillBaseMd,
  publicTabTriggerClass,
} from "@/lib/public-ui-classes";
import type { TablesCategoryPublic } from "@/services/tables-public.service";
import { cn } from "@/lib/utils";

type Props = {
  category: TablesCategoryPublic;
};

type ViewMode = "geral" | "grupos";

export function TablesCategoryPanel({ category }: Props) {
  const [view, setView] = useState<ViewMode>("geral");
  const [selectedGroupId, setSelectedGroupId] = useState(category.groups[0]?.id ?? "");

  const selectedGroup = useMemo(
    () => category.groups.find((g) => g.id === selectedGroupId) ?? category.groups[0],
    [category.groups, selectedGroupId]
  );

  const hasGeneral = category.generalStandings.length > 0;
  const hasAnyGroupData = category.groups.some((g) => g.standings.length > 0);
  const hasGroups = category.groups.length > 0;

  if (!hasGeneral && !hasAnyGroupData && !hasGroups) {
    return (
      <section className="overflow-hidden border-b border-line/60 last:border-b-0">
        <CategoryHeader category={category} />
        <div className="py-4 sm:py-5">
          <ChampionshipEmptyPanel
            icon={ListOrdered}
            title="Classificação ainda não publicada"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden border-b border-line/60 last:border-b-0">
      <CategoryHeader category={category} />

      <div className="py-4 sm:py-5">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as ViewMode)}
          className="w-full"
        >
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="geral" className={publicTabTriggerClass}>
              <ListOrdered className="h-4 w-4 shrink-0" aria-hidden />
              Classificação geral
            </TabsTrigger>
            <TabsTrigger value="grupos" className={publicTabTriggerClass} disabled={!hasGroups}>
              <Layers className="h-4 w-4 shrink-0" aria-hidden />
              Classificação por grupo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="mt-0 focus-visible:ring-0">
            {hasGeneral ? (
              <StandingTable rows={category.generalStandings} />
            ) : (
              <ChampionshipEmptyPanel
                icon={ListOrdered}
                title="Sem classificação geral"
                description="Ainda não há jogos finalizados nesta categoria."
              />
            )}
          </TabsContent>

          <TabsContent value="grupos" className="mt-0 focus-visible:ring-0">
            {!hasGroups ? (
              <ChampionshipEmptyPanel icon={Layers} title="Nenhum grupo cadastrado" />
            ) : (
              <div className="space-y-4">
                <nav className="flex flex-wrap gap-2" aria-label="Selecionar grupo">
                  {category.groups.map((g) => {
                    const active = g.id === (selectedGroup?.id ?? "");
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGroupId(g.id)}
                        className={cn(categoryPillBaseMd, active && categoryPillActive)}
                        aria-current={active ? "true" : undefined}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </nav>

                {selectedGroup ? (
                  selectedGroup.standings.length > 0 ? (
                    <StandingTable rows={selectedGroup.standings} />
                  ) : (
                    <ChampionshipEmptyPanel
                      icon={Layers}
                      title={`Sem classificação — ${selectedGroup.name}`}
                      description="Ainda não há jogos finalizados neste grupo."
                    />
                  )
                ) : null}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function CategoryHeader({ category }: { category: TablesCategoryPublic }) {
  return (
    <div className="space-y-1 border-b border-line/60 px-0 py-3 sm:py-4">
      <Link
        href={`/campeonatos/${category.championshipSlug}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Trophy className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        <span className="line-clamp-1">{category.championshipName}</span>
        <span className="text-muted-foreground/60">·</span>
        <span>Temporada {category.season}</span>
      </Link>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <Layers className="h-4 w-4 text-muted-foreground" aria-hidden />
        {category.name}
      </h2>
    </div>
  );
}
