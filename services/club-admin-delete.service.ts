import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteMatchesWithDependents } from "@/services/match-delete.service";
import { recalculateStandingsForGroup } from "@/services/standings.service";

const INACTIVE_CLUB_STATUSES = ["SUSPENDED", "REJECTED"] as const;

export type DetachClubEnrollmentsResult = {
  teamsRemoved: number;
  matchesDeleted: number;
  groupsTouched: string[];
};

/**
 * Remove o clube de todos os grupos (inscrições Team) e jogos em que participa.
 */
export async function detachClubFromAllGroups(clubId: string): Promise<DetachClubEnrollmentsResult> {
  const teams = await prisma.team.findMany({
    where: { clubId },
    select: { id: true, groupId: true },
  });
  if (teams.length === 0) {
    return { teamsRemoved: 0, matchesDeleted: 0, groupsTouched: [] };
  }

  const teamIds = teams.map((t) => t.id);
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
    },
    select: { id: true },
  });
  const matchIds = matches.map((m) => m.id);
  const groupsTouched = [...new Set(teams.map((t) => t.groupId))];

  await prisma.$transaction(async (tx) => {
    await deleteMatchesWithDependents(tx, matchIds);
    await tx.standingRow.deleteMany({ where: { teamId: { in: teamIds } } });
    await tx.lineup.deleteMany({ where: { teamId: { in: teamIds } } });
    await tx.team.deleteMany({ where: { clubId } });
  });

  for (const groupId of groupsTouched) {
    try {
      await recalculateStandingsForGroup(groupId);
    } catch {
      // grupo pode não ter classificação ainda
    }
  }

  return {
    teamsRemoved: teams.length,
    matchesDeleted: matchIds.length,
    groupsTouched,
  };
}

/** Remove inscrições neste grupo cujo clube foi suspenso/rejeitado (ex.: exclusão “soft”). */
export async function cleanupInactiveClubEnrollmentsInGroup(
  groupId: string
): Promise<DetachClubEnrollmentsResult> {
  const inactiveClubIds = (
    await prisma.team.findMany({
      where: {
        groupId,
        club: { status: { in: [...INACTIVE_CLUB_STATUSES] } },
      },
      select: { clubId: true },
      distinct: ["clubId"],
    })
  ).map((t) => t.clubId);

  let teamsRemoved = 0;
  let matchesDeleted = 0;
  const groupsTouched = new Set<string>();

  for (const clubId of inactiveClubIds) {
    const r = await detachClubFromAllGroups(clubId);
    teamsRemoved += r.teamsRemoved;
    matchesDeleted += r.matchesDeleted;
    for (const g of r.groupsTouched) groupsTouched.add(g);
  }

  return { teamsRemoved, matchesDeleted, groupsTouched: [...groupsTouched] };
}

export type DeleteClubAdminResult = DetachClubEnrollmentsResult & {
  hardDeleted: boolean;
  softDeleted: boolean;
};

export async function deleteClubAsAdmin(clubId: string): Promise<DeleteClubAdminResult> {
  const detach = await detachClubFromAllGroups(clubId);

  try {
    await prisma.club.delete({ where: { id: clubId } });
    return { ...detach, hardDeleted: true, softDeleted: false };
  } catch (error) {
    const code =
      error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null;
    if (code === "P2003" || code === "P2014") {
      await prisma.club.update({
        where: { id: clubId },
        data: { status: "SUSPENDED" },
      });
      return { ...detach, hardDeleted: false, softDeleted: true };
    }
    throw error;
  }
}
