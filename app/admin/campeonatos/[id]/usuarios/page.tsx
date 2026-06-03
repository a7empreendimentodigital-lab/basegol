import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ChampionshipUsersAdmin } from "@/components/admin/championship-users/ChampionshipUsersAdmin";

type Props = { params: Promise<{ id: string }> };

export default async function ChampionshipAdminUsersPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const actorRole = session?.user?.role?.toUpperCase() ?? "VISITANTE";

  return <ChampionshipUsersAdmin championshipId={id} actorRole={actorRole} />;
}
