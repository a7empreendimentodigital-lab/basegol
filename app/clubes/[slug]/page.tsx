import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { ClubMatchesSection } from "@/components/clubes/ClubMatchesSection";
import { ClubSquadSection } from "@/components/clubes/ClubSquadSection";
import { getClubPublicMatches } from "@/services/match.service";
import { ClubFavoriteAction } from "@/components/favorites/ClubFavoriteAction";
import { TeamCrest } from "@/components/matches/TeamCrest";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { getPublicClubBySlug } from "@/services/public.service";
import { notFound } from "next/navigation";

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await getPublicClubBySlug(slug);
  if (!club) notFound();

  const clubMatches = await getClubPublicMatches(club.id);

  const groupEntries = club.teams
    .map((t) => ({
      groupId: t.group.id,
      groupName: t.group.name,
      categoryName: t.group.category.name,
      championshipName: t.group.category.championship.name,
      season: t.group.category.championship.season,
    }))
    .filter(
      (item, index, arr) => arr.findIndex((x) => x.groupId === item.groupId) === index
    );

  const categoryOrder = [
    ...new Set(groupEntries.map((g) => g.categoryName)),
  ];

  const squadAthletes = club.athletes.map((a) => ({
    id: a.id,
    slug: a.slug,
    firstName: a.firstName,
    lastName: a.lastName,
    position: a.position,
    photoUrl: a.photoUrl,
    shirtNumber: a.shirtNumber,
    category: a.category,
  }));

  return (
    <PublicRightSidebarLayout>
      <main className="mx-auto w-full max-w-4xl space-y-8 px-3 py-4 sm:space-y-10 sm:px-5 sm:py-6 lg:px-8">
        <Link
          href="/clubes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar aos clubes
        </Link>

        <header className="border-b border-line/60 pb-6 sm:pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div className="shrink-0">
              <TeamCrest url={club.crestUrl} name={club.name} size="xl" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1 className="font-display text-2xl tracking-wide text-foreground sm:text-4xl">
                    {club.name}
                  </h1>
                  {club.city ? (
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {club.city}
                      {club.state ? ` / ${club.state}` : ""}
                    </p>
                  ) : null}
                </div>
                <ClubFavoriteAction clubId={club.id} />
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{club._count.athletes}</span> atletas
                cadastrados
              </p>
            </div>
          </div>
        </header>

        {groupEntries.length > 0 ? (
          <section className="border-b border-line/60 pb-5 sm:pb-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Layers className="h-4 w-4 text-muted-foreground" aria-hidden />
              Grupos e categorias
            </h2>
            <ul className="divide-y divide-line/60">
              {groupEntries.map((g) => (
                <li key={g.groupId} className="py-2.5 text-sm first:pt-0">
                  <p className="font-medium text-foreground">{g.groupName}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.categoryName} · {g.championshipName} ({g.season})
                  </p>
                </li>
              ))}
            </ul>
            <Link
              href="/clubes?tab=grupos"
              className="mt-3 inline-block text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Ver todos os grupos →
            </Link>
          </section>
        ) : null}

        <ClubMatchesSection {...clubMatches} />

        <section className="space-y-5 pt-2">
          <h2 className="font-display text-2xl tracking-wide text-foreground">Elenco</h2>
          <ClubSquadSection athletes={squadAthletes} categoryOrder={categoryOrder} />
        </section>
      </main>
    </PublicRightSidebarLayout>
  );
}
