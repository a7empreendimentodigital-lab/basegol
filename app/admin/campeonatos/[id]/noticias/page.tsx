import { AdminNewsPage } from "@/components/admin/news/AdminNewsPage";

type Props = { params: Promise<{ id: string }> };

export default async function ChampionshipAdminNewsPage({ params }: Props) {
  const { id } = await params;
  return <AdminNewsPage championshipId={id} />;
}
