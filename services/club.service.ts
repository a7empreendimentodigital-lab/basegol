import { prisma } from "@/lib/prisma";

export async function getClubContextByUserId(userId: string) {
  const clubUser = await prisma.clubUser.findFirst({
    where: { userId },
    include: { club: true },
  });
  return clubUser ?? null;
}

export async function listClubAthletes(clubId: string) {
  return prisma.athlete.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listClubDocuments(clubId: string) {
  return prisma.document.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listClubUpcomingMatches(clubId: string) {
  return prisma.match.findMany({
    where: {
      OR: [{ homeTeam: { clubId } }, { awayTeam: { clubId } }],
      scheduledAt: { gte: new Date() },
    },
    include: {
      homeTeam: { include: { club: true } },
      awayTeam: { include: { club: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 10,
  });
}
