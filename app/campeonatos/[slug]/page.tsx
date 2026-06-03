import { ChampionshipHomeDashboard } from "@/components/campeonatos/ChampionshipHomeDashboard";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";
import { getChampionshipPortalBase } from "@/services/championship-portal.service";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ categoria?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ch = await getChampionshipPortalBase(slug);
  if (!ch) return { title: "Campeonato" };
  return { title: `${ch.name} — BaseGol` };
}

export default async function ChampionshipHomePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { categoria } = await searchParams;
  const championship = await getChampionshipPortalBase(slug);
  if (!championship) notFound();

  return (
    <PublicRightSidebarLayout championshipSlug={slug}>
      <ChampionshipHomeDashboard
        championshipId={championship.id}
        championshipSlug={slug}
        bannerUrl={championship.bannerUrl}
        categoriaParam={categoria}
      />
    </PublicRightSidebarLayout>
  );
}
