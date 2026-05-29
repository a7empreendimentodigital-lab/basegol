import { ChampionshipCard } from "@/components/campeonatos/ChampionshipCard";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { PAGE_TOP_BANNERS } from "@/lib/page-banners";
import { listPublicChampionships } from "@/services/public.service";

export const metadata = { title: "Campeonatos" };

export default async function CampeonatosPage() {
  const championships = await listPublicChampionships();

  return (
    <PublicRightSidebarLayout>
      <PublicPageBanner
        src={PAGE_TOP_BANNERS.campeonatos}
        title="Campeonatos"
        subtitle="Competições e temporadas do futebol de base"
      />

      <main className="w-full space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {championships.length === 0 ? (
          <p className="rounded-2xl border border-line bg-graphite-light py-10 text-center text-sm text-muted-foreground">
            Nenhum campeonato ativo no momento.
          </p>
        ) : (
          <div className="grid w-full grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            {championships.map((c) => (
              <ChampionshipCard
                key={c.slug}
                slug={c.slug}
                name={c.name}
                season={c.season}
                status={c.status}
                logoUrl={c.logoUrl}
                description={c.description}
              />
            ))}
          </div>
        )}
      </main>
    </PublicRightSidebarLayout>
  );
}
