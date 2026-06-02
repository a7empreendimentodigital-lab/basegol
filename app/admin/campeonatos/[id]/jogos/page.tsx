import { AdminMatchesPage } from "@/components/admin/matches/AdminMatchesPage";

type Props = { params: Promise<{ id: string }> };

export default async function ChampionshipAdminMatchesPage({ params }: Props) {
  const { id } = await params;
  return <AdminMatchesPage championshipId={id} />;
}
