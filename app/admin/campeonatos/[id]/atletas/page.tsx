import { AdminAthletesPage } from "@/components/admin/athletes/AdminAthletesPage";

type Props = { params: Promise<{ id: string }> };

export default async function ChampionshipAdminAthletesPage({ params }: Props) {
  const { id } = await params;
  return <AdminAthletesPage championshipId={id} />;
}
