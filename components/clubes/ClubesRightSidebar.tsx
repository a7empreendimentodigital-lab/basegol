"use client";

import { useMemo, useState } from "react";
import { Layers, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PublicCategoryGroups } from "@/services/public.service";
import { categoryPillActive, categoryPillBase } from "@/lib/public-ui-classes";
import { TeamCrest } from "@/components/matches/TeamCrest";
import { HomeSectionLink } from "@/components/home/HomeSectionLink";
import { SidebarAdBanner } from "@/components/public/SidebarAdBanner";
import type { PublicBannerDto } from "@/services/banner.service";

type Props = {
  categories: PublicCategoryGroups[];
  rightBanner?: PublicBannerDto | null;
};

function Patrocinio({ rightBanner }: { rightBanner?: PublicBannerDto | null }) {
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

export function ClubesRightSidebar({ categories, rightBanner }: Props) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [groupId, setGroupId] = useState(categories[0]?.groups[0]?.id ?? "");

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? categories[0],
    [categories, categoryId]
  );

  const group = useMemo(() => {
    const groups = category?.groups ?? [];
    return groups.find((g) => g.id === groupId) ?? groups[0];
  }, [category, groupId]);

  if (categories.length === 0) {
    return (
      <div className="max-xl:divide-y max-xl:divide-line xl:space-y-4">
        <p className="py-4 text-sm text-muted-foreground">Nenhum grupo cadastrado.</p>
        <Patrocinio rightBanner={rightBanner} />
      </div>
    );
  }

  const teams = group?.teams ?? [];

  return (
    <div className="max-xl:divide-y max-xl:divide-line xl:space-y-4">
      <section className="py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-muted-foreground" aria-hidden />
            Competições
          </h2>
          <HomeSectionLink href="/campeonatos">Ver todas</HomeSectionLink>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => {
            const active = cat.id === category?.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategoryId(cat.id);
                  setGroupId(cat.groups[0]?.id ?? "");
                }}
                className={cn(categoryPillBase, active && categoryPillActive)}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {category && category.groups.length > 1 && (
        <section className="py-2">
          <div className="flex flex-wrap gap-1.5">
            {category.groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroupId(g.id)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  g.id === group?.id
                    ? "border-foreground/30 bg-foreground/10 text-foreground"
                    : "border-line text-muted-foreground hover:border-foreground/20"
                )}
              >
                {g.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
            <Layers className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{group?.name ?? "Grupo"}</span>
            <span className="text-xs font-normal text-muted-foreground">
              ({teams.length})
            </span>
          </h2>
          <HomeSectionLink href="/tabelas">Tabelas</HomeSectionLink>
        </div>
        {teams.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum clube neste grupo.</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((team) => (
              <li key={team.id}>
                <Link
                  href={`/clubes/${team.slug}`}
                  className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-graphite/60"
                >
                  <TeamCrest url={team.crestUrl} name={team.displayName} size="sm" />
                  <span className="min-w-0 truncate text-sm text-foreground" title={team.name}>
                    {team.displayName}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Patrocinio rightBanner={rightBanner} />
    </div>
  );
}
