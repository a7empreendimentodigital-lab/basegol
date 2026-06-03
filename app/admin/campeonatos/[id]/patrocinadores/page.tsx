import { ChampionshipSponsorsAdmin } from "@/components/admin/championship-sponsors/ChampionshipSponsorsAdmin";

type Props = { params: Promise<{ id: string }> };

export default async function ChampionshipAdminSponsorsPage({ params }: Props) {
  const { id } = await params;
  return <ChampionshipSponsorsAdmin championshipId={id} />;
}
