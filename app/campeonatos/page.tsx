import { ChampionshipCard } from "@/components/campeonatos/ChampionshipCard";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { PublicPageBanner } from "@/components/layout/PublicPageBanner";
import { publicListShell } from "@/lib/public-ui-classes";
import { listPublicChampionships } from "@/services/public.service";

export const metadata = { title: "Campeonatos" };

export default async function CampeonatosPage() {
  const championships = await listPublicChampionships();

  return (
    <PublicRightSidebarLayout>
      <PublicPageBanner title="Campeonatos" />

      <main className="w-full space-y-5 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        {championships.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground border-t border-line/60">
            Nenhum campeonato ativo no momento.
          </p>
        ) : (
          <div className={publicListShell}>
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
