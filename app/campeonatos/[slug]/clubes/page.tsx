import { ClubCrestCard } from "@/components/clubes/ClubCrestCard";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { getChampionshipClubsForPortal, getChampionshipPortalBase } from "@/services/championship-portal.service";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ChampionshipClubesPage({ params }: PageProps) {
  const { slug } = await params;
  const championship = await getChampionshipPortalBase(slug);
  if (!championship) notFound();

  const clubs = await getChampionshipClubsForPortal(championship.id);

  return (
    <PublicRightSidebarLayout championshipSlug={slug}>
      <PublicPageBanner title="Clubes" />
      <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {clubs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum clube inscrito neste campeonato.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 border-t border-line/60 pt-4">
            {clubs.map((club) => (
              <ClubCrestCard
                key={club.id}
                slug={club.slug}
                name={club.displayName}
                city={club.city}
                crestUrl={club.crestUrl}
              />
            ))}
          </div>
        )}
      </main>
    </PublicRightSidebarLayout>
  );
}
