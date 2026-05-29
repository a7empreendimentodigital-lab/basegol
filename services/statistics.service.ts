import { prisma } from "@/lib/prisma";
import type { StandingRowDisplay } from "@/types";

export type TopScorer = {
  athleteId: string;
  name: string;
  club: string;
  clubCrestUrl: string | null;
  goals: number;
  photoUrl: string | null;
};

function mapStandingRows(
  rows: {
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    form: string | null;
    team: { club: { name: string; crestUrl: string | null } };
  }[]
): StandingRowDisplay[] {
  return rows.map((r) => ({
    position: r.position,
    teamName: r.team.club.name,
    crestUrl: r.team.club.crestUrl,
    played: r.played,
    won: r.won,
    drawn: r.drawn,
    lost: r.lost,
    goalsFor: r.goalsFor,
    goalsAgainst: r.goalsAgainst,
    points: r.points,
    form: r.form,
  }));
}

export async function getLatestStandings(): Promise<StandingRowDisplay[]> {
  try {
    const standing = await prisma.standing.findFirst({
      where: { groupId: null },
      orderBy: { updatedAt: "desc" },
      include: {
        rows: {
          orderBy: { position: "asc" },
          include: { team: { include: { club: true } } },
        },
      },
    });

    if (!standing) return [];
    return mapStandingRows(standing.rows);
  } catch {
    return [];
  }
}

export async function getStandingsForCategory(categoryId: string): Promise<StandingRowDisplay[]> {
  try {
    const standing = await prisma.standing.findFirst({
      where: { categoryId, groupId: null },
      orderBy: { updatedAt: "desc" },
      include: {
        rows: {
          orderBy: { position: "asc" },
          include: { team: { include: { club: true } } },
        },
      },
    });
    if (!standing) return [];
    return mapStandingRows(standing.rows);
  } catch {
    return [];
  }
}

export async function getStandingsForGroup(groupId: string): Promise<StandingRowDisplay[]> {
  try {
    const standing = await prisma.standing.findFirst({
      where: { groupId },
      include: {
        rows: {
          orderBy: { position: "asc" },
          include: { team: { include: { club: true } } },
        },
      },
    });
    if (!standing) return [];
    return mapStandingRows(standing.rows);
  } catch {
    return [];
  }
}

export async function getTopScorersForCategory(
  categoryId: string,
  limit = 10
): Promise<TopScorer[]> {
  try {
    const matchIds = await prisma.match.findMany({
      where: { group: { categoryId } },
      select: { id: true },
    });
    const ids = matchIds.map((m) => m.id);
    if (ids.length === 0) return [];

    const grouped = await prisma.matchEvent.groupBy({
      by: ["athleteId"],
      where: {
        matchId: { in: ids },
        athleteId: { not: null },
        type: { in: ["GOAL", "PENALTY_GOAL"] },
      },
      _count: { athleteId: true },
      orderBy: { _count: { athleteId: "desc" } },
      take: limit,
    });

    const athleteIds = grouped.map((g) => g.athleteId).filter((id): id is string => Boolean(id));
    if (athleteIds.length === 0) return [];

    const athletes = await prisma.athlete.findMany({
      where: { id: { in: athleteIds } },
      include: { club: true },
    });
    const athleteMap = new Map(athletes.map((a) => [a.id, a]));

    return grouped
      .map((g) => {
        if (!g.athleteId) return null;
        const a = athleteMap.get(g.athleteId);
        if (!a) return null;
        return {
          athleteId: a.id,
          name: `${a.firstName} ${a.lastName}`,
          club: a.club.name,
          clubCrestUrl: a.club.crestUrl,
          goals: g._count.athleteId,
          photoUrl: a.photoUrl,
        };
      })
      .filter((v): v is TopScorer => Boolean(v));
  } catch {
    return [];
  }
}

export async function getTopScorers(limit = 10): Promise<TopScorer[]> {
  try {
    const grouped = await prisma.matchEvent.groupBy({
      by: ["athleteId"],
      where: {
        athleteId: { not: null },
        type: { in: ["GOAL", "PENALTY_GOAL"] },
      },
      _count: { athleteId: true },
      orderBy: { _count: { athleteId: "desc" } },
      take: limit,
    });

    const ids = grouped.map((g) => g.athleteId).filter((id): id is string => Boolean(id));
    if (ids.length === 0) return [];

    const athletes = await prisma.athlete.findMany({
      where: { id: { in: ids } },
      include: { club: true },
    });

    const athleteMap = new Map(athletes.map((a) => [a.id, a]));
    return grouped
      .map((g) => {
        if (!g.athleteId) return null;
        const a = athleteMap.get(g.athleteId);
        if (!a) return null;
        return {
          athleteId: a.id,
          name: `${a.firstName} ${a.lastName}`,
          club: a.club.name,
          clubCrestUrl: a.club.crestUrl,
          goals: g._count.athleteId,
          photoUrl: a.photoUrl,
        };
      })
      .filter((v): v is TopScorer => Boolean(v));
  } catch {
    return [];
  }
}

