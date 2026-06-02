import { resolveDefaultPaulistaChampionshipId } from "@/lib/resolve-paulista-championship";
import { prisma } from "@/lib/prisma";

export type PurgeMatchesResult = {
  championshipId: string | null;
  championshipName: string | null;
  matchesDeleted: number;
  standingsCleared: number;
  standingRowsDeleted: number;
  scheduleImportsDeleted: number;
  favoritesRemoved: number;
};

async function resolveChampionship(championshipId?: string) {
  if (championshipId) {
    const ch = await prisma.championship.findUnique({
      where: { id: championshipId },
      select: { id: true, name: true },
    });
    if (!ch) throw new Error("Campeonato não encontrado.");
    return ch;
  }
  return resolveDefaultPaulistaChampionshipId();
}

/**
 * Remove somente jogos e dados ligados a eles (eventos, escalação, estatísticas).
 * Não altera grupos, times inscritos, clubes nem categorias.
 */
export async function purgeMatchesOnly(input?: {
  championshipId?: string;
  dryRun?: boolean;
}): Promise<PurgeMatchesResult> {
  const championship = await resolveChampionship(input?.championshipId);
  const dryRun = input?.dryRun === true;

  const matchWhere = {
    OR: [
      { championshipId: championship.id },
      { group: { category: { championshipId: championship.id } } },
    ],
  };

  const categoryIds = (
    await prisma.category.findMany({
      where: { championshipId: championship.id },
      select: { id: true },
    })
  ).map((c) => c.id);

  const groupIds =
    categoryIds.length > 0
      ? (
          await prisma.group.findMany({
            where: { categoryId: { in: categoryIds } },
            select: { id: true },
          })
        ).map((g) => g.id)
      : [];

  const matches = await prisma.match.findMany({
    where: matchWhere,
    select: { id: true },
  });
  const matchIds = matches.map((m) => m.id);

  const standingWhere = {
    OR: [
      ...(categoryIds.length ? [{ categoryId: { in: categoryIds } }] : []),
      ...(groupIds.length ? [{ groupId: { in: groupIds } }] : []),
    ],
  };

  const [standingCount, standingRowCount, importCount] = await Promise.all([
    standingWhere.OR.length
      ? prisma.standing.count({ where: standingWhere })
      : Promise.resolve(0),
    standingWhere.OR.length
      ? prisma.standingRow.count({ where: { standing: standingWhere } })
      : Promise.resolve(0),
    prisma.scheduleImport.count({ where: { championshipId: championship.id } }),
  ]);

  if (dryRun) {
    return {
      championshipId: championship.id,
      championshipName: championship.name,
      matchesDeleted: matchIds.length,
      standingsCleared: standingCount,
      standingRowsDeleted: standingRowCount,
      scheduleImportsDeleted: importCount,
      favoritesRemoved: matchIds.length
        ? await prisma.favorite.count({
            where: { type: "MATCH", entityId: { in: matchIds } },
          })
        : 0,
    };
  }

  let favoritesRemoved = 0;
  let matchesDeleted = 0;

  await prisma.$transaction(async (tx) => {
    if (matchIds.length > 0) {
      const fav = await tx.favorite.deleteMany({
        where: { type: "MATCH", entityId: { in: matchIds } },
      });
      favoritesRemoved = fav.count;
    }

    const deleted = await tx.match.deleteMany({ where: matchWhere });
    matchesDeleted = deleted.count;

    if (standingWhere.OR.length) {
      await tx.standingRow.deleteMany({ where: { standing: standingWhere } });
      await tx.standing.deleteMany({ where: standingWhere });
    }

    await tx.scheduleImport.deleteMany({ where: { championshipId: championship.id } });
    await tx.competitionRound.deleteMany({ where: { championshipId: championship.id } });
  });

  return {
    championshipId: championship.id,
    championshipName: championship.name,
    matchesDeleted,
    standingsCleared: standingCount,
    standingRowsDeleted: standingRowCount,
    scheduleImportsDeleted: importCount,
    favoritesRemoved,
  };
}
