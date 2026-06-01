import { prisma } from "@/lib/prisma";
import { recalculateStandingsForGroup } from "@/services/standings.service";

export type RemoveTeamFromGroupResult = {
  teamId: string;
  clubName: string;
  matchesDeleted: number;
};

/**
 * Remove inscrição do clube no grupo.
 * Sem `force`, falha se houver jogos. Com `force`, apaga jogos do grupo envolvendo o time.
 */
export async function removeTeamFromGroup(
  groupId: string,
  teamId: string,
  options?: { force?: boolean }
): Promise<RemoveTeamFromGroupResult> {
  const team = await prisma.team.findFirst({
    where: { id: teamId, groupId },
    include: { club: { select: { name: true } } },
  });
  if (!team) {
    throw new Error("Equipe não encontrada neste grupo.");
  }

  const matches = await prisma.match.findMany({
    where: {
      groupId,
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    select: { id: true },
  });

  if (matches.length > 0 && !options?.force) {
    throw new Error(
      `Este clube tem ${matches.length} jogo(s) neste grupo. Use remoção forçada para apagar esses jogos junto, ou exclua os jogos em Admin → Jogos.`
    );
  }

  const matchIds = matches.map((m) => m.id);

  await prisma.$transaction(async (tx) => {
    if (matchIds.length > 0) {
      await tx.matchEvent.deleteMany({ where: { matchId: { in: matchIds } } });
      await tx.lineup.deleteMany({ where: { matchId: { in: matchIds } } });
      await tx.matchOperator.deleteMany({ where: { matchId: { in: matchIds } } });
      await tx.matchStatistic.deleteMany({ where: { matchId: { in: matchIds } } });
      await tx.match.deleteMany({ where: { id: { in: matchIds } } });
    }

    await tx.standingRow.deleteMany({ where: { teamId } });
    await tx.team.delete({ where: { id: teamId } });
  });

  try {
    await recalculateStandingsForGroup(groupId);
  } catch {
    // grupo pode não ter standing ainda
  }

  return {
    teamId,
    clubName: team.club.name,
    matchesDeleted: matchIds.length,
  };
}
