import { GroupsByCategoryList } from "@/components/admin/GroupsByCategoryList";

type Props = { params: Promise<{ id: string }> };

export default async function ChampionshipAdminGroupsPage({ params }: Props) {
  const { id } = await params;
  return <GroupsByCategoryList championshipId={id} />;
}
