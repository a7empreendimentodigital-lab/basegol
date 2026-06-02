import { ChampionshipCategorySection } from "@/components/campeonatos/ChampionshipCategorySection";
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
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {championship.categories.length === 0 ? (
        <p className="rounded-xl border border-line/60 bg-graphite/30 px-6 py-12 text-center text-sm text-muted-foreground">
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
  );
}
