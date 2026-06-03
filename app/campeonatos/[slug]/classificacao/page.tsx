import { ChampionshipCategorySection } from "@/components/campeonatos/ChampionshipCategorySection";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { getChampionshipPublicDetail } from "@/services/championship-public.service";
import { getTopScorersForCategory } from "@/services/statistics.service";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ChampionshipClassificacaoPage({ params }: PageProps) {
  const { slug } = await params;
  const championship = await getChampionshipPublicDetail(slug);
  if (!championship) notFound();

  const scorersByCategory = await Promise.all(
    championship.categories.map(async (cat) => ({
      categoryId: cat.id,
      scorers: await getTopScorersForCategory(cat.id, 10),
    }))
  );

  return (
    <PublicRightSidebarLayout championshipSlug={slug}>
      <PublicPageBanner title="Tabelas" />
      <main className="w-full space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {championship.categories.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground border-t border-line/60">
            Nenhuma classificação disponível para este campeonato.
          </p>
        ) : (
          <div className="space-y-2">
            {championship.categories.map((cat) => {
              const scorers =
                scorersByCategory.find((s) => s.categoryId === cat.id)?.scorers ?? [];
              return (
                <ChampionshipCategorySection
                  key={cat.id}
                  categoryName={cat.name}
                  generalStandings={cat.generalStandings}
                  groups={cat.groups}
                  scorers={scorers}
                />
              );
            })}
          </div>
        )}
      </main>
    </PublicRightSidebarLayout>
  );
}
