import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertCanManageChampionshipSponsors } from "@/lib/championship-sponsor-access";
import { ChampionshipSponsorsAdmin } from "@/components/admin/championship-sponsors/ChampionshipSponsorsAdmin";

type Props = { params: Promise<{ id: string }> };

export default async function ChampionshipAdminSponsorsPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const role = session?.user?.role ?? "";

  if (!userId) {
    redirect("/login");
  }

  try {
    await assertCanManageChampionshipSponsors(userId, role, id);
  } catch {
    redirect("/");
  }

  return <ChampionshipSponsorsAdmin championshipId={id} />;
}
