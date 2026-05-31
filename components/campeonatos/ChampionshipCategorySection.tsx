"use client";

import { Award, Layers, ListOrdered } from "lucide-react";
import { StandingTable } from "@/components/matches/StandingTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { publicTabTriggerClass } from "@/lib/public-ui-classes";
import type { StandingRowDisplay } from "@/types";
import type { TopScorer } from "@/services/statistics.service";
import { ChampionshipEmptyPanel } from "./ChampionshipEmptyPanel";
import { ChampionshipTopScorersList } from "./ChampionshipTopScorersList";

type GroupTab = {
  id: string;
  name: string;
  standings: StandingRowDisplay[];
};

type Props = {
  categoryName: string;
  generalStandings: StandingRowDisplay[];
  groups: GroupTab[];
  scorers: TopScorer[];
};

export function ChampionshipCategorySection({
  categoryName,
  generalStandings,
  groups,
  scorers,
}: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-graphite-light">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5 sm:px-5">
        <Layers className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <h2 className="text-base font-semibold text-foreground sm:text-lg">{categoryName}</h2>
      </div>

      <div className="p-4 sm:p-5">
        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="geral" className={publicTabTriggerClass}>
              <ListOrdered className="h-4 w-4 shrink-0" aria-hidden />
              Classificação geral
            </TabsTrigger>
            {groups.map((g) => (
              <TabsTrigger key={g.id} value={`group-${g.id}`} className={publicTabTriggerClass}>
                <Layers className="h-4 w-4 shrink-0" aria-hidden />
                {g.name}
              </TabsTrigger>
            ))}
            <TabsTrigger value="artilheiros" className={publicTabTriggerClass}>
              <Award className="h-4 w-4 shrink-0" aria-hidden />
              Artilheiros
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="mt-0 focus-visible:ring-0">
            {generalStandings.length === 0 ? (
              <ChampionshipEmptyPanel icon={ListOrdered} title="Sem classificação geral" />
            ) : (
              <StandingTable rows={generalStandings} />
            )}
          </TabsContent>

          {groups.map((g) => (
            <TabsContent key={g.id} value={`group-${g.id}`} className="mt-0 focus-visible:ring-0">
              {g.standings.length === 0 ? (
                <ChampionshipEmptyPanel
                  icon={Layers}
                  title={`Sem classificação — ${g.name}`}
                />
              ) : (
                <StandingTable rows={g.standings} />
              )}
            </TabsContent>
          ))}

          <TabsContent value="artilheiros" className="mt-0 focus-visible:ring-0">
            <ChampionshipTopScorersList scorers={scorers} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
