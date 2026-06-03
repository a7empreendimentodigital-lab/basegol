import { ClubCrestCard } from "@/components/clubes/ClubCrestCard";
import { ClubesFilterTabs } from "@/components/clubes/ClubesFilterTabs";
import { PublicGroupsView } from "@/components/clubes/PublicGroupsView";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { ChampionshipEmptyPanel } from "@/components/campeonatos/ChampionshipEmptyPanel";
import { Shield } from "lucide-react";
import Link from "next/link";
import { redirectGlobalRouteToPortalChampionship } from "@/lib/redirect-portal-championship";
import { getServerPortalChampionshipSlug } from "@/lib/portal-championship-context.server";
import {
  getChampionshipClubsForPortal,
  getChampionshipPortalBase,
} from "@/services/championship-portal.service";
import { listPublicGroupsByCategory } from "@/services/public.service";

export const metadata = { title: "Clubes" };

export const dynamic = "force-dynamic";

export default async function ClubesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  await redirectGlobalRouteToPortalChampionship("clubes", { tab });

  const championshipSlug = await getServerPortalChampionshipSlug();
  const showGroups = tab === "grupos";

  if (!championshipSlug) {
    return (
      <>
        <PublicPageBanner title={showGroups ? "Grupos" : "Clubes"} />
        <main className="w-full space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          <ChampionshipEmptyPanel
            icon={Shield}
            title="Selecione um campeonato"
            description="Escolha um campeonato na página inicial para ver clubes e grupos."
          />
          <p className="mt-4 text-center text-sm">
            <Link href="/" className="font-medium text-foreground underline-offset-4 hover:underline">
              Ir para campeonatos
            </Link>
          </p>
        </main>
      </>
    );
  }

  const championship = await getChampionshipPortalBase(championshipSlug);
  if (!championship) {
    return (
      <>
        <PublicPageBanner title="Clubes" />
        <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
          <ChampionshipEmptyPanel icon={Shield} title="Campeonato não encontrado" />
        </main>
      </>
    );
  }

  const [clubs, groupsData] = await Promise.all([
    showGroups ? Promise.resolve([]) : getChampionshipClubsForPortal(championship.id),
    showGroups ? listPublicGroupsByCategory(championship.id) : Promise.resolve([]),
  ]);

  const clubesBase = `/campeonatos/${championshipSlug}/clubes`;

  return (
    <>
      <PublicPageBanner title={showGroups ? "Grupos" : "Clubes"} />
      <main className="w-full space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <ClubesFilterTabs active={showGroups ? "grupos" : "clubes"} basePath={clubesBase} />
        {showGroups ? (
          <PublicGroupsView categories={groupsData} />
        ) : clubs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground border-t border-line/60">
            Nenhum clube inscrito neste campeonato.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {clubs.map((c) => (
              <ClubCrestCard
                key={c.id}
                slug={c.slug}
                name={c.displayName}
                city={c.city}
                crestUrl={c.crestUrl}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
