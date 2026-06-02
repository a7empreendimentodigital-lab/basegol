import type { Prisma } from "@prisma/client";

/** Remove partidas e dependências (eventos, escalação, operadores, estatísticas). */
export async function deleteMatchesWithDependents(
  tx: Prisma.TransactionClient,
  matchIds: string[]
) {
  if (matchIds.length === 0) return;
  await tx.matchEvent.deleteMany({ where: { matchId: { in: matchIds } } });
  await tx.lineup.deleteMany({ where: { matchId: { in: matchIds } } });
  await tx.matchOperator.deleteMany({ where: { matchId: { in: matchIds } } });
  await tx.matchStatistic.deleteMany({ where: { matchId: { in: matchIds } } });
  await tx.match.deleteMany({ where: { id: { in: matchIds } } });
}
