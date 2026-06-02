import { CalendarDays } from "lucide-react";
import type { MatchWithTeams } from "@/types";
import { JogosCategoryTabs } from "@/components/jogos/JogosCategoryTabs";
import { MatchList } from "@/components/matches/MatchList";
import { HomeSectionLink } from "@/components/home/HomeSectionLink";
import { buildCategoryFilterHref } from "@/lib/jogos-category-filter";
import type { JogosCategoryOption } from "@/lib/jogos-category-filter";

type Props = {
  matches: MatchWithTeams[];
  categories: JogosCategoryOption[];
  activeCategory: string | null;
  /** Rota base para filtros de categoria (padrão: `/`). */
  pathname?: string;
  /** Link "Ver todos" (padrão: `/jogos`). */
  allMatchesHref?: string;
};

export function TodayMatchesSection({
  matches,
  categories,
  activeCategory,
  pathname = "/",
  allMatchesHref = "/jogos",
}: Props) {
  const activeCategoryName =
    activeCategory != null
      ? categories.find((c) => c.slug === activeCategory)?.name ?? null
      : null;

  const emptyMessage =
    activeCategoryName != null
      ? `Nenhum jogo em ${activeCategoryName} hoje.`
      : "Nenhum jogo agendado para hoje.";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="h-5 w-5 text-muted-foreground" aria-hidden />
          <h2 className="font-display text-2xl tracking-wide text-foreground">Jogos de hoje</h2>
        </div>
        <HomeSectionLink
          href={buildCategoryFilterHref(allMatchesHref, { categorySlug: activeCategory })}
        >
          Ver todos
        </HomeSectionLink>
      </div>

      <JogosCategoryTabs
        categories={categories}
        activeSlug={activeCategory}
        pathname={pathname}
        embedded
      />

      <MatchList matches={matches} emptyMessage={emptyMessage} variant="today" />
    </section>
  );
}
