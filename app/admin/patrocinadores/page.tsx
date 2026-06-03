import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrimaryChampionshipIdForUser } from "@/lib/championship-access";
import { canViewAllChampionshipSponsors } from "@/lib/championship-sponsor-access";
import { ChampionshipSponsorsGlobalAdmin } from "@/components/admin/championship-sponsors/ChampionshipSponsorsGlobalAdmin";

export default async function AdminPatrocinadoresPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toUpperCase() ?? "";
  const userId = session?.user?.id;

  if (role === "ADMIN_CAMPEONATO" && userId) {
    const championshipId =
      session?.user?.championshipId ??
      (await getPrimaryChampionshipIdForUser(userId, role));
    if (championshipId) {
      redirect(`/admin/campeonatos/${championshipId}/patrocinadores`);
    }
    redirect("/admin/campeonatos");
  }

  if (!canViewAllChampionshipSponsors(role)) {
    redirect("/");
  }

  return <ChampionshipSponsorsGlobalAdmin />;
}
