"use client";

import { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HomeCategory } from "@/types/home";
import { categoryPillActive, categoryPillBase } from "@/lib/public-ui-classes";
import { HomeStandingsCard } from "@/components/home/HomeStandingsCard";
import { HomeTopScorersCard, type TopScorerRow } from "@/components/home/HomeTopScorersCard";
import { HomeSectionLink } from "@/components/home/HomeSectionLink";
import type { StandingRowDisplay } from "@/types";
import { SidebarAdBanner } from "@/components/public/SidebarAdBanner";
import { ChampionshipSponsorsBlock } from "@/components/public/ChampionshipSponsorsBlock";
import type { PublicBannerDto } from "@/services/banner.service";

type Props = {
  categories: HomeCategory[];
  standingsByCategory: Record<string, StandingRowDisplay[]>;
  scorersByCategory: Record<string, TopScorerRow[]>;
  rightBanner?: PublicBannerDto | null;
  championshipSlug?: string;
  competitionsLink?: string;
  tableHref?: string;
};

function RightSidebarPatrocinio({
  rightBanner,
  championshipSlug,
}: {
  rightBanner?: PublicBannerDto | null;
  championshipSlug?: string;
}) {
  if (championshipSlug) {
    return (
      <ChampionshipSponsorsBlock
        championshipSlug={championshipSlug}
        placement="SIDEBAR_RIGHT"
        variant="right"
        className="py-4 xl:mt-2 xl:border-t xl:border-line xl:pt-4 max-md:px-4 sm:max-md:px-5 md:px-0"
      />
    );
  }

  if (!rightBanner?.imageUrl) return null;

  return (
    <div className="py-4 xl:mt-2 xl:border-t xl:border-line xl:pt-4">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Patrocinador
      </p>
      <div className="max-md:px-4 sm:max-md:px-5 md:px-0">
        <SidebarAdBanner banner={rightBanner} variant="right" className="max-md:rounded-2xl" />
      </div>
    </div>
  );
}

export function HomeRightSidebar({
  categories,
  standingsByCategory,
  scorersByCategory,
  rightBanner,
  championshipSlug,
  competitionsLink = "/campeonatos",
  tableHref = "/tabela",
}: Props) {
  const [selectedId, setSelectedId] = useState(categories[0]?.id ?? "");

  useEffect(() => {
    const first = categories[0]?.id ?? "";
    setSelectedId((prev) =>
      categories.some((c) => c.id === prev) ? prev : first
    );
  }, [categories, championshipSlug]);

  const selected = useMemo(
    () => categories.find((c) => c.id === selectedId) ?? categories[0],
    [categories, selectedId]
  );

  if (categories.length === 0) {
    return (
      <div className="max-xl:divide-y max-xl:divide-line xl:space-y-4">
        <p className="py-4 text-sm text-muted-foreground">
          Nenhuma competição ativa no momento.
        </p>
        <RightSidebarPatrocinio
          rightBanner={rightBanner}
          championshipSlug={championshipSlug}
        />
      </div>
    );
  }

  const standings = (standingsByCategory[selectedId] ?? []).slice(0, 8);
  const scorers = (scorersByCategory[selectedId] ?? []).slice(0, 5);

  return (
    <div className="max-xl:divide-y max-xl:divide-line xl:space-y-4">
      <section className="py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-muted-foreground" aria-hidden />
            Competições
          </h2>
          <HomeSectionLink href={competitionsLink}>Ver todas</HomeSectionLink>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => {
            const active = cat.id === selectedId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedId(cat.id)}
                className={cn(categoryPillBase, active && categoryPillActive)}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {standings.length > 0 && (
        <HomeStandingsCard
          title="Tabela"
          categoryLabel={selected?.label}
          tableLinkLabel="Classificação geral"
          tableHref={tableHref}
          rows={standings}
          layout="sidebar"
        />
      )}

      {scorers.length > 0 && (
        <HomeTopScorersCard
          title="Artilheiros"
          categoryLabel={selected?.label}
          scorers={scorers}
          layout="sidebar"
        />
      )}

      <RightSidebarPatrocinio
        rightBanner={rightBanner}
        championshipSlug={championshipSlug}
      />
    </div>
  );
}
