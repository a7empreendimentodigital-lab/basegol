import { notFound } from "next/navigation";
import { ChampionshipAdminShell } from "@/components/admin/championship-admin/ChampionshipAdminShell";
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

  return (
    <ChampionshipAdminShell
      championshipId={championship.id}
      championshipName={championship.name}
    >
      {children}
    </ChampionshipAdminShell>
  );
}
