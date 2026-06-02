import { NewsCard } from "@/components/news/NewsCard";
import { getChampionshipNewsForPortal, getChampionshipPortalBase } from "@/services/championship-portal.service";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ChampionshipNoticiasPage({ params }: PageProps) {
  const { slug } = await params;
  const championship = await getChampionshipPortalBase(slug);
  if (!championship) notFound();

  const news = await getChampionshipNewsForPortal(championship.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {news.length === 0 ? (
        <p className="rounded-xl border border-line/60 bg-graphite/30 px-6 py-12 text-center text-sm text-muted-foreground">
          Nenhuma notícia publicada para este campeonato.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      )}
    </main>
  );
}
