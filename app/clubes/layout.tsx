import { ClubesLayoutShell } from "@/components/clubes/ClubesLayoutShell";
import { getServerPortalChampionshipSlug } from "@/lib/portal-championship-context.server";
import { getChampionshipPortalBase } from "@/services/championship-portal.service";

export const dynamic = "force-dynamic";

export default async function ClubesLayout({ children }: { children: React.ReactNode }) {
  const slug = await getServerPortalChampionshipSlug();
  const championship = slug ? await getChampionshipPortalBase(slug) : null;

  return (
    <ClubesLayoutShell
      championshipId={championship?.id ?? null}
      championshipSlug={slug}
    >
      {children}
    </ClubesLayoutShell>
  );
}
