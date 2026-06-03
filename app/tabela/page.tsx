import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { ChampionshipEmptyPanel } from "@/components/campeonatos/ChampionshipEmptyPanel";
import { ChartColumn } from "lucide-react";
import Link from "next/link";
import { redirectGlobalRouteToPortalChampionship } from "@/lib/redirect-portal-championship";
import { getServerPortalChampionshipSlug } from "@/lib/portal-championship-context.server";
import { getChampionshipPublicDetail } from "@/services/championship-public.service";
import { getTopScorersForCategory } from "@/services/statistics.service";
import { ChampionshipCategorySection } from "@/components/campeonatos/ChampionshipCategorySection";

export const metadata = { title: "Tabelas" };

export default async function TabelaPage() {
  await redirectGlobalRouteToPortalChampionship("classificacao", {});

  const championshipSlug = await getServerPortalChampionshipSlug();

  if (!championshipSlug) {
    return (
      <PublicRightSidebarLayout>
        <PublicPageBanner title="Tabelas" />
        <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          <ChampionshipEmptyPanel
            icon={ChartColumn}
            title="Selecione um campeonato"
            description="Escolha um campeonato na página inicial para ver classificação e artilheiros."
          />
          <p className="mt-4 text-center text-sm">
            <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
              Ir para campeonatos
            </Link>
          </p>
        </main>
      </PublicRightSidebarLayout>
    );
  }

  const championship = await getChampionshipPublicDetail(championshipSlug);
  if (!championship) {
    return (
      <PublicRightSidebarLayout>
        <PublicPageBanner title="Tabelas" />
        <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          <ChampionshipEmptyPanel icon={ChartColumn} title="Campeonato não encontrado" />
        </main>
      </PublicRightSidebarLayout>
    );
  }

  const scorersByCategory = await Promise.all(
    championship.categories.map(async (cat) => ({
      categoryId: cat.id,
      scorers: await getTopScorersForCategory(cat.id, 10),
    }))
  );

  return (
    <PublicRightSidebarLayout championshipSlug={championshipSlug}>
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
