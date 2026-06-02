import { AdminCategoriesPage } from "@/components/admin/categories/AdminCategoriesPage";

type Props = { params: Promise<{ id: string }> };

export default async function ChampionshipAdminCategoriesPage({ params }: Props) {
  const { id } = await params;
  return <AdminCategoriesPage championshipId={id} />;
}
