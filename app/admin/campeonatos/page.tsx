import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminChampionshipsPage } from "@/components/admin/championships/AdminChampionshipsPage";

export default async function AdminCampeonatosPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toUpperCase();
  const championshipId = session?.user?.championshipId;

  if (role === "ADMIN_CAMPEONATO" && championshipId) {
    redirect(`/admin/campeonatos/${championshipId}`);
  }

  return <AdminChampionshipsPage />;
}
