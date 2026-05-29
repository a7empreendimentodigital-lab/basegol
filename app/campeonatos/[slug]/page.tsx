import { ChampionshipCategorySection } from "@/components/campeonatos/ChampionshipCategorySection";
import { ChampionshipDetailHeader } from "@/components/campeonatos/ChampionshipDetailHeader";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { getChampionshipPublicDetail } from "@/services/championship-public.service";
import { getTopScorersForCategory } from "@/services/statistics.service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const championship = await getChampionshipPublicDetail(slug);
  if (!championship) return { title: "Campeonato" };
  return { title: championship.name };
}

export default async function ChampionshipPage({ params }: PageProps) {
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
    <PublicRightSidebarLayout>
    <main className="w-full space-y-6 px-3 py-4 sm:space-y-8 sm:px-5 sm:py-6 lg:px-8">
      <ChampionshipDetailHeader
        name={championship.name}
        season={championship.season}
        logoUrl={championship.logoUrl}
        description={championship.description}
      />

      {championship.categories.length === 0 ? (
        <p className="rounded-2xl border border-line bg-graphite-light py-10 text-center text-sm text-muted-foreground">
          Nenhuma categoria cadastrada para este campeonato.
        </p>
      ) : (
        <div className="space-y-5 sm:space-y-6">
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
