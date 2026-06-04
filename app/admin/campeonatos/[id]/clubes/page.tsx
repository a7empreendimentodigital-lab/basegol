import { AdminClubsPage } from "@/components/admin/clubs/AdminClubsPage";

type Props = { params: Promise<{ id: string }> };

export default async function ChampionshipAdminClubsPage({ params }: Props) {
  const { id } = await params;
  return <AdminClubsPage championshipId={id} />;
}
