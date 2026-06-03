import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ChampionshipAdminShell } from "@/components/admin/championship-admin/ChampionshipAdminShell";
import { userHasChampionshipAccess } from "@/lib/championship-access";
import { prisma } from "@/lib/prisma";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function ChampionshipAdminLayout({ children, params }: Props) {
  const { id } = await params;
  const championship = await prisma.championship.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!championship) notFound();

  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toUpperCase() ?? "";
  const userId = session?.user?.id;
  if (userId && role === "ADMIN_CAMPEONATO") {
    const allowed = await userHasChampionshipAccess(userId, role, championship.id);
    if (!allowed) redirect("/");
  }

  return (
    <ChampionshipAdminShell
      championshipId={championship.id}
      championshipName={championship.name}
      userRole={role}
    >
      {children}
    </ChampionshipAdminShell>
  );
}
