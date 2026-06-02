import { ClubCrestCard } from "@/components/clubes/ClubCrestCard";
import { getChampionshipClubsForPortal, getChampionshipPortalBase } from "@/services/championship-portal.service";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ChampionshipClubesPage({ params }: PageProps) {
  const { slug } = await params;
  const championship = await getChampionshipPortalBase(slug);
  if (!championship) notFound();

  const clubs = await getChampionshipClubsForPortal(championship.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {clubs.length === 0 ? (
        <p className="rounded-xl border border-line/60 bg-graphite/30 px-6 py-12 text-center text-sm text-muted-foreground">
          Nenhum clube inscrito neste campeonato.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {clubs.map((club) => (
            <ClubCrestCard
              key={club.id}
              slug={club.slug}
              name={club.displayName}
              city={club.city}
              crestUrl={club.crestUrl}
              className="rounded-xl border border-line/40 bg-graphite/30"
            />
          ))}
        </div>
      )}
    </main>
  );
}
