import { notFound } from "next/navigation";
import { getChampionshipPortalBase } from "@/services/championship-portal.service";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

/** Valida o campeonato. Cookie do slug é definido no middleware. */
export default async function ChampionshipLayout({ children, params }: Props) {
  const { slug } = await params;
  const championship = await getChampionshipPortalBase(slug);
  if (!championship) notFound();
  return <>{children}</>;
}
