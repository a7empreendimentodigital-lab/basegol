import { notFound } from "next/navigation";
import { persistServerPortalChampionshipSlug } from "@/lib/portal-championship-context.server";
import { getChampionshipPortalBase } from "@/services/championship-portal.service";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

/** Valida o campeonato; persiste o slug para rotas sem prefixo (/favoritos, etc.). */
export default async function ChampionshipLayout({ children, params }: Props) {
  const { slug } = await params;
  const championship = await getChampionshipPortalBase(slug);
  if (!championship) notFound();
  await persistServerPortalChampionshipSlug(slug);
  return <>{children}</>;
}
