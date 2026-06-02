import Link from "next/link";
import { Tag } from "lucide-react";
import { buildJogosHref } from "@/lib/jogos-category-filter";
import { categoryPillActive, categoryPillBaseMd } from "@/lib/public-ui-classes";
import type { JogosCategoryOption } from "@/lib/jogos-category-filter";
import { cn } from "@/lib/utils";

type Props = {
  categories: JogosCategoryOption[];
  activeSlug: string | null;
  statusPath: "/jogos" | "/jogos?status=LIVE" | "/jogos?status=upcoming";
};

export function JogosCategoryTabs({ categories, activeSlug, statusPath }: Props) {
  if (categories.length < 2) return null;

  return (
    <div className="border-b border-line/60 px-3 py-3 sm:px-5 sm:py-4 lg:px-8">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Categoria
      </p>
      <nav className="flex flex-wrap gap-2" aria-label="Filtrar por categoria">
        <Link
          href={buildJogosHref(statusPath, null)}
          className={cn(categoryPillBaseMd, !activeSlug && categoryPillActive)}
          aria-current={!activeSlug ? "true" : undefined}
        >
          Todas
        </Link>
        {categories.map((cat) => {
          const active = activeSlug === cat.slug;
          return (
            <Link
              key={cat.slug}
              href={buildJogosHref(statusPath, cat.slug)}
              className={cn(categoryPillBaseMd, active && categoryPillActive)}
              aria-current={active ? "true" : undefined}
            >
              {cat.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
