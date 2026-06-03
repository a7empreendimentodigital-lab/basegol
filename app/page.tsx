import { HomeChampionshipPicker } from "@/components/portal/HomeChampionshipPicker";
import { PortalInstitutionalShell } from "@/components/portal/PortalInstitutionalShell";
import { listPortalChampionships } from "@/services/championship-portal.service";

export const metadata = {
  title: "BaseGol — Escolha seu campeonato",
  description: "Acompanhe os principais campeonatos de futebol de base.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const championships = await listPortalChampionships();

  return (
    <PortalInstitutionalShell>
      <HomeChampionshipPicker
        championships={championships.map((c) => ({
          slug: c.slug,
          name: c.name,
          season: c.season,
          logoUrl: c.logoUrl,
          description: c.description,
        }))}
        initialQuery={q?.trim() ?? ""}
      />
    </PortalInstitutionalShell>
  );
}
