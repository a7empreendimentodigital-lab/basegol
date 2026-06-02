import { notFound } from "next/navigation";
import { ChampionshipPortalHeader } from "@/components/portal/ChampionshipPortalHeader";
import { ChampionshipPortalNav } from "@/components/portal/ChampionshipPortalNav";
import { PortalEntryFooter } from "@/components/portal/PortalEntryFooter";
import { getChampionshipPortalBase } from "@/services/championship-portal.service";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function ChampionshipPortalLayout({ children, params }: Props) {
  const { slug } = await params;
  const championship = await getChampionshipPortalBase(slug);
  if (!championship) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-pitch">
      <ChampionshipPortalHeader
        name={championship.name}
        slug={championship.slug}
        season={championship.season}
        logoUrl={championship.logoUrl}
        bannerUrl={championship.bannerUrl}
        description={championship.description}
      />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <ChampionshipPortalNav slug={slug} />
      </div>
      <div className="flex-1">{children}</div>
      <PortalEntryFooter />
    </div>
  );
}
