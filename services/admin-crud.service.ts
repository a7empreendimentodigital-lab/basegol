import { resolveMatchScoresForDisplay } from "@/lib/match-live";
import { prisma } from "@/lib/prisma";
import { prismaContains } from "@/lib/prisma-search";

export async function listUsersAdmin(page: number, pageSize: number, q?: string) {
  const skip = (page - 1) * pageSize;
  const where = q ? { email: prismaContains(q) } : undefined;
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { role: true, clubUsers: { include: { club: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total };
}

export async function listClubsAdmin(page: number, pageSize: number, q?: string) {
  const skip = (page - 1) * pageSize;
  const where = {
    status: { not: "SUSPENDED" as const },
    ...(q
      ? {
          OR: [
            { name: prismaContains(q) },
            { city: prismaContains(q) },
            { slug: prismaContains(q) },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.club.findMany({
      where,
      include: { _count: { select: { athletes: true, documents: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.club.count({ where }),
  ]);
  return { items, total };
}

export async function listMatchesAdmin(
  page: number,
  pageSize: number,
  filters?: {
    categoryId?: string;
    clubId?: string;
    roundNumber?: number;
    championshipId?: string;
    q?: string;
  }
) {
  const skip = (page - 1) * pageSize;

  const clubFilter = filters?.clubId
    ? {
        OR: [{ homeClubId: filters.clubId }, { awayClubId: filters.clubId }],
      }
    : {};

  const textFilter = filters?.q
    ? {
        OR: [
          { homeTeam: { club: { name: prismaContains(filters.q) } } },
          { awayTeam: { club: { name: prismaContains(filters.q) } } },
          { venue: prismaContains(filters.q) },
        ],
      }
    : {};

  const where = {
    ...(filters?.championshipId
      ? {
          OR: [
            { championshipId: filters.championshipId },
            { group: { category: { championshipId: filters.championshipId } } },
          ],
        }
      : {}),
    ...(filters?.categoryId ? { group: { categoryId: filters.categoryId } } : {}),
    ...(filters?.roundNumber != null ? { round: filters.roundNumber } : {}),
    ...(filters?.clubId && filters?.q
      ? { AND: [clubFilter, textFilter] }
      : filters?.clubId
        ? clubFilter
        : filters?.q
          ? textFilter
          : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.match.findMany({
      where,
      include: {
        homeTeam: { include: { club: true } },
        awayTeam: { include: { club: true } },
        group: { include: { category: { include: { championship: true } } } },
        competitionRound: { select: { number: true, label: true } },
        events: {
          where: {
            type: { in: ["GOAL", "PENALTY_GOAL", "PENALTY_MISS", "KICKOFF"] },
          },
          orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
          select: {
            type: true,
            teamId: true,
            description: true,
            minute: true,
            createdAt: true,
          },
        },
      },
      orderBy: filters?.roundNumber != null
        ? [{ scheduledAt: "asc" }]
        : [{ round: "asc" }, { scheduledAt: "asc" }],
      skip,
      take: pageSize,
    }),
    prisma.match.count({ where }),
  ]);

  const items = rows.map((m) => {
    const scores = resolveMatchScoresForDisplay(m, m.events);
    return {
      ...m,
      homeScore: scores.homeScore,
      awayScore: scores.awayScore,
      homePenaltyScore: scores.homePenaltyScore,
      awayPenaltyScore: scores.awayPenaltyScore,
      homePenaltyAttempts: scores.homePenaltyAttempts,
      awayPenaltyAttempts: scores.awayPenaltyAttempts,
    };
  });

  return { items, total };
}
