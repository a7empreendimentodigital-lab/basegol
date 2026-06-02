import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChampionshipCategorySection } from "@/components/campeonatos/ChampionshipCategorySection";
import { ClubCrestCard } from "@/components/clubes/ClubCrestCard";
import { LiveMatchesSection } from "@/components/matches/LiveMatchesSection";
import { MatchList } from "@/components/matches/MatchList";
import { NewsCard } from "@/components/news/NewsCard";
import type { getCategoryPortalDetail } from "@/services/championship-portal.service";

type CategoryData = NonNullable<Awaited<ReturnType<typeof getCategoryPortalDetail>>>;

type Props = {
  data: CategoryData;
};

export function CategoryPortalView({ data }: Props) {
  const { category, championship, liveMatches, todayMatches, upcomingMatches, scorers, news, clubs, generalStandings, groups } =
    data;

  const upcomingToShow =
    upcomingMatches.length > 0
      ? upcomingMatches
      : todayMatches.filter((m) => !liveMatches.some((l) => l.id === m.id));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      <div>
        <Link
          href={`/campeonatos/${championship.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar ao campeonato
        </Link>
        <h1 className="mt-3 font-display text-2xl tracking-wide text-foreground sm:text-3xl">
          {category.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{championship.name}</p>
      </div>

      {liveMatches.length > 0 ? (
        <section>
          <LiveMatchesSection matches={liveMatches} />
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Próximos jogos</h2>
        <MatchList
          matches={upcomingToShow.slice(0, 12)}
          emptyMessage="Nenhum jogo agendado nesta categoria."
        />
      </section>

      <section>
        <ChampionshipCategorySection
          categoryName="Classificação"
          generalStandings={generalStandings}
          groups={groups}
          scorers={scorers}
        />
      </section>

      {clubs.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Clubes</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {clubs.map((club) => (
              <ClubCrestCard
                key={club.id}
                slug={club.slug}
                name={club.displayName}
                crestUrl={club.crestUrl}
                className="rounded-xl border border-line/40 bg-graphite/30"
              />
            ))}
          </div>
        </section>
      ) : null}

      {news.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Notícias</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {news.map((n) => (
              <NewsCard
                key={n.id}
                news={{
                  id: n.id,
                  title: n.title,
                  slug: n.slug,
                  summary: n.summary,
                  imageUrl: n.imageUrl,
                  category: null,
                  publishedAt: n.publishedAt,
                  isFeatured: false,
                }}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
