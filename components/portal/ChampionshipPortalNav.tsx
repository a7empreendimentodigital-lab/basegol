"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { championshipNavPath } from "@/lib/portal-routes";
import { cn } from "@/lib/utils";

const SEGMENTS = [
  { key: "inicio", label: "Início" },
  { key: "jogos", label: "Jogos" },
  { key: "classificacao", label: "Classificação" },
  { key: "clubes", label: "Clubes" },
  { key: "noticias", label: "Notícias" },
] as const;

type Props = {
  slug: string;
};

export function ChampionshipPortalNav({ slug }: Props) {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="flex flex-wrap gap-1 border-b border-line/50 pb-px"
      aria-label="Campeonato"
    >
      {SEGMENTS.map((item) => {
        const href = championshipNavPath(slug, item.key === "inicio" ? undefined : item.key);
        const active =
          item.key === "inicio"
            ? pathname === `/campeonatos/${slug}`
            : pathname.startsWith(`/campeonatos/${slug}/${item.key}`);

        return (
          <Link
            key={item.key}
            href={href}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg",
              active
                ? "text-primary border-b-2 border-primary -mb-px bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-graphite/40"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
