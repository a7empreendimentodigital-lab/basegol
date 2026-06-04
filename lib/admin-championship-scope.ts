import type { Prisma } from "@prisma/client";

/** Clubes com pelo menos uma inscrição (team) em grupo deste campeonato. */
export function clubsInChampionshipWhere(
  championshipId: string
): Prisma.ClubWhereInput {
  return {
    teams: {
      some: {
        group: { category: { championshipId } },
      },
    },
  };
}

/** Atletas de clubes inscritos neste campeonato. */
export function athletesInChampionshipWhere(
  championshipId: string
): Prisma.AthleteWhereInput {
  return {
    club: clubsInChampionshipWhere(championshipId),
  };
}
