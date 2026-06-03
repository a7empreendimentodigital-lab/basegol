import { NewsCard } from "@/components/news/NewsCard";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { getChampionshipNewsForPortal, getChampionshipPortalBase } from "@/services/championship-portal.service";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ChampionshipNoticiasPage({ params }: PageProps) {
  const { slug } = await params;
  const championship = await getChampionshipPortalBase(slug);
  if (!championship) notFound();

  const news = await getChampionshipNewsForPortal(championship.id);

  return (
    <PublicRightSidebarLayout championshipSlug={slug}>
      <PublicPageBanner title="Notícias" />
      <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {news.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma notícia publicada para este campeonato.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 border-t border-line/60 pt-4">
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
    </PublicRightSidebarLayout>
  );
}
