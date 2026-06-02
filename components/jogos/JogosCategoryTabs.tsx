import Link from "next/link";
import { Tag } from "lucide-react";
import {
  buildCategoryFilterHref,
  type JogosCategoryOption,
  type MatchCategoryFilterStatus,
} from "@/lib/jogos-category-filter";
import { categoryPillActive, categoryPillBaseMd } from "@/lib/public-ui-classes";
import { cn } from "@/lib/utils";

type Props = {
  categories: JogosCategoryOption[];
  activeSlug: string | null;
  pathname?: string;
  status?: MatchCategoryFilterStatus;
  /** Menos padding — uso na home */
  embedded?: boolean;
};

export function JogosCategoryTabs({
  categories,
  activeSlug,
  pathname = "/jogos",
  status,
  embedded = false,
}: Props) {
  if (categories.length < 2) return null;

  const href = (categorySlug: string | null) =>
    buildCategoryFilterHref(pathname, { status, categorySlug });

  return (
    <div
      className={cn(
        embedded ? "py-1" : "border-b border-line/60 px-3 py-3 sm:px-5 sm:py-4 lg:px-8"
      )}
    >
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Categoria
      </p>
      <nav className="flex flex-wrap gap-2" aria-label="Filtrar por categoria">
        <Link
          href={href(null)}
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
              href={href(cat.slug)}
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
