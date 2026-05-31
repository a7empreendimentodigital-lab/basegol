import { ClubCrestCard } from "@/components/clubes/ClubCrestCard";
import { ClubesFilterTabs } from "@/components/clubes/ClubesFilterTabs";
import { PublicGroupsView } from "@/components/clubes/PublicGroupsView";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { listPublicClubs, listPublicGroupsByCategory } from "@/services/public.service";

export const metadata = { title: "Clubes" };

export default async function ClubesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const showGroups = tab === "grupos";

  const [clubs, groupsData] = await Promise.all([
    listPublicClubs(),
    listPublicGroupsByCategory(),
  ]);

  return (
    <PublicRightSidebarLayout>
      <PublicPageBanner title={showGroups ? "Grupos" : "Clubes"} />

      <main className="w-full space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <ClubesFilterTabs active={showGroups ? "grupos" : "clubes"} />

        {showGroups ? (
          <PublicGroupsView categories={groupsData} />
        ) : clubs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground border-t border-line/60">
            Nenhum clube cadastrado.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {clubs.map((c) => (
              <ClubCrestCard
                key={c.slug}
                slug={c.slug}
                name={c.name}
                city={c.city}
                crestUrl={c.crestUrl}
              />
            ))}
          </div>
        )}
      </main>
    </PublicRightSidebarLayout>
  );
}
