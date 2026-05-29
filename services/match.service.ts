import { prisma } from "@/lib/prisma";
import type { MatchWithTeams } from "@/types";

const matchInclude = {
  homeTeam: { include: { club: true } },
  awayTeam: { include: { club: true } },
  group: {
    include: {
      category: {
        include: { championship: true },
      },
    },
  },
} as const;

function mapMatch(m: Awaited<ReturnType<typeof fetchMatchRaw>>): MatchWithTeams | null {
  if (!m) return null;
  return {
    id: m.id,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    minute: m.minute,
    scheduledAt: m.scheduledAt,
    venue: m.venue,
    round: m.round,
    championshipName: m.group?.category?.championship?.name ?? null,
    categoryName: m.group?.category?.name ?? null,
    homeTeam: {
      id: m.homeTeam.id,
      club: {
        id: m.homeTeam.club.id,
        name: m.homeTeam.club.name,
        shortName: m.homeTeam.club.shortName,
        crestUrl: m.homeTeam.club.crestUrl,
      },
    },
    awayTeam: {
      id: m.awayTeam.id,
      club: {
        id: m.awayTeam.club.id,
        name: m.awayTeam.club.name,
        shortName: m.awayTeam.club.shortName,
        crestUrl: m.awayTeam.club.crestUrl,
      },
    },
  };
}

async function fetchMatchRaw(id: string) {
  try {
    return await prisma.match.findUnique({
      where: { id },
      include: matchInclude,
    });
  } catch {
    return null;
  }
}

export async function getLiveMatches(): Promise<MatchWithTeams[]> {
  try {
    const matches = await prisma.match.findMany({
      where: { status: { in: ["LIVE", "HALFTIME"] } },
      include: matchInclude,
      orderBy: { scheduledAt: "asc" },
      take: 10,
    });
    return matches.map((m) => mapMatch(m)!);
  } catch {
    return [];
  }
}

export async function getTodayMatches(): Promise<MatchWithTeams[]> {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const matches = await prisma.match.findMany({
      where: { scheduledAt: { gte: start, lte: end } },
      include: matchInclude,
      orderBy: { scheduledAt: "asc" },
    });
    return matches.map((m) => mapMatch(m)!);
  } catch {
    return [];
  }
}

export async function getMatchById(id: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        ...matchInclude,
        events: {
          orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
          include: { athlete: { include: { club: true } } },
        },
        statistics: true,
        lineups: {
          include: {
            athlete: true,
            team: { include: { club: true } },
          },
        },
        group: { include: { category: { include: { championship: true } } } },
      },
    });
    if (match) return match;
  } catch {
    // fallback
  }
  return null;
}

export async function getUpcomingMatches(limit = 40): Promise<MatchWithTeams[]> {
  try {
    const now = new Date();
    const matches = await prisma.match.findMany({
      where: {
        scheduledAt: { gte: now },
        status: { in: ["SCHEDULED", "POSTPONED"] },
      },
      include: matchInclude,
      orderBy: { scheduledAt: "asc" },
      take: limit,
    });
    return matches.map((m) => mapMatch(m)!);
  } catch {
    return [];
  }
}

export async function getAllMatches(status?: string) {
  try {
    return await prisma.match.findMany({
      where: status ? { status: status as "LIVE" } : undefined,
      include: matchInclude,
      orderBy: { scheduledAt: "desc" },
      take: 50,
    });
  } catch {
    return [];
  }
}
