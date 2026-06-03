import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertCanManageChampionshipSponsors } from "@/lib/championship-sponsor-access";
import { ChampionshipSponsorsAdmin } from "@/components/admin/championship-sponsors/ChampionshipSponsorsAdmin";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
};

export default async function ChampionshipAdminSponsorsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { new: newParam } = await searchParams;
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

  return <ChampionshipSponsorsAdmin championshipId={id} autoOpenCreate={newParam === "1"} />;
}
