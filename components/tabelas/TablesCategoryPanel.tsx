"use client";

import Link from "next/link";
import { Layers, ListOrdered, Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChampionshipEmptyPanel } from "@/components/campeonatos/ChampionshipEmptyPanel";
import { StandingTable } from "@/components/matches/StandingTable";
import { publicTabTriggerClass } from "@/lib/public-ui-classes";
import type { TablesCategoryPublic } from "@/services/tables-public.service";

type Props = {
  category: TablesCategoryPublic;
};

export function TablesCategoryPanel({ category }: Props) {
  const hasGeneral = category.generalStandings.length > 0;
  const hasAnyGroup = category.groups.some((g) => g.standings.length > 0);
  const defaultTab = hasGeneral ? "geral" : category.groups[0] ? `group-${category.groups[0].id}` : "geral";

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-graphite-light">
      <div className="space-y-1 border-b border-line px-4 py-4 sm:px-5">
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

      <div className="p-4 sm:p-5">
        {!hasGeneral && !hasAnyGroup && category.groups.length === 0 ? (
          <ChampionshipEmptyPanel
            icon={ListOrdered}
            title="Classificação ainda não publicada"
            description="A tabela desta categoria aparecerá aqui quando for cadastrada no admin."
          />
        ) : (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
              <TabsTrigger value="geral" className={publicTabTriggerClass}>
                <ListOrdered className="h-4 w-4 shrink-0" aria-hidden />
                Classificação geral
              </TabsTrigger>
              {category.groups.map((g) => (
                <TabsTrigger key={g.id} value={`group-${g.id}`} className={publicTabTriggerClass}>
                  <Layers className="h-4 w-4 shrink-0" aria-hidden />
                  {g.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="geral" className="mt-0 focus-visible:ring-0">
              {hasGeneral ? (
                <StandingTable rows={category.generalStandings} />
              ) : (
                <ChampionshipEmptyPanel
                  icon={ListOrdered}
                  title="Sem classificação geral"
                  description="Cadastre equipes e resultados para montar a tabela geral."
                />
              )}
            </TabsContent>

            {category.groups.map((g) => (
              <TabsContent key={g.id} value={`group-${g.id}`} className="mt-0 focus-visible:ring-0">
                {g.standings.length > 0 ? (
                  <StandingTable rows={g.standings} />
                ) : (
                  <ChampionshipEmptyPanel
                    icon={Layers}
                    title={`Sem classificação — ${g.name}`}
                    description="Os jogos deste grupo ainda não geraram pontuação na tabela."
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </section>
  );
}
