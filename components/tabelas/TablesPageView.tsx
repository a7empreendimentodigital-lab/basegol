"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ListOrdered, Trophy } from "lucide-react";
import { ChampionshipEmptyPanel } from "@/components/campeonatos/ChampionshipEmptyPanel";
import { HomeSectionLink } from "@/components/home/HomeSectionLink";
import { TablesCategoryPanel } from "@/components/tabelas/TablesCategoryPanel";
import { categoryPillActive, categoryPillBaseMd } from "@/lib/public-ui-classes";
import { cn } from "@/lib/utils";
import type { TablesCategoryPublic } from "@/services/tables-public.service";

type Props = {
  categories: TablesCategoryPublic[];
};

export function TablesPageView({ categories }: Props) {
  const [selectedId, setSelectedId] = useState(categories[0]?.id ?? "");

  const selected = useMemo(
    () => categories.find((c) => c.id === selectedId) ?? categories[0],
    [categories, selectedId]
  );

  if (categories.length === 0) {
    return (
      <ChampionshipEmptyPanel
        icon={ListOrdered}
        title="Nenhuma competição com tabelas"
        description="Quando houver campeonatos ativos e categorias cadastradas, as classificações aparecerão aqui."
      />
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-2xl border border-line bg-graphite-light p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-muted-foreground" aria-hidden />
            Categoria
          </h2>
          <HomeSectionLink href="/campeonatos">Ver campeonatos</HomeSectionLink>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = cat.id === selectedId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedId(cat.id)}
                className={cn(categoryPillBaseMd, active && categoryPillActive)}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
        {selected ? (
          <p className="mt-3 text-xs text-muted-foreground">
            <Link
              href={`/campeonatos/${selected.championshipSlug}`}
              className="hover:text-foreground transition-colors"
            >
              {selected.championshipName}
            </Link>
            {" · "}
            Temporada {selected.season}
          </p>
        ) : null}
      </section>

      {selected ? <TablesCategoryPanel key={selected.id} category={selected} /> : null}
    </div>
  );
}
