import { prisma } from "@/lib/prisma";

export async function syncUserClubLink(
  userId: string,
  roleSlug: string,
  clubId: string | null | undefined
) {
  if (roleSlug !== "CLUBE") {
    await prisma.clubUser.deleteMany({ where: { userId } });
    return;
  }
  if (!clubId) return;
  await prisma.clubUser.deleteMany({ where: { userId } });
  await prisma.clubUser.create({
    data: { userId, clubId, role: "OWNER" },
  });
}

export async function syncUserChampionshipMembership(
  userId: string,
  roleSlug: string,
  championshipId: string | null | undefined
) {
  if (roleSlug !== "ADMIN_CAMPEONATO") {
    await prisma.championshipMember.deleteMany({ where: { userId } });
    return;
  }
  if (!championshipId) return;
  await prisma.championshipMember.deleteMany({ where: { userId } });
  await prisma.championshipMember.create({
    data: { userId, championshipId },
  });
}

export async function syncUserOperatorMatches(
  userId: string,
  roleSlug: string,
  matchIds: string[] | undefined,
  assignedBy: string
) {
  if (roleSlug !== "OPERADOR_DE_PARTIDA") {
    await prisma.matchOperator.deleteMany({ where: { userId } });
    return;
  }
  if (matchIds === undefined) return;

  await prisma.matchOperator.deleteMany({ where: { userId } });
  if (matchIds.length === 0) return;

  await prisma.matchOperator.createMany({
    data: matchIds.map((matchId) => ({
      matchId,
      userId,
      canEditLive: true,
      canEditStats: true,
      assignedBy,
    })),
    skipDuplicates: true,
  });
}
