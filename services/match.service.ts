import type { MatchEventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  resolveElapsedSeconds,
  resolveMatchPeriodForDisplay,
  type MatchEventLike,
} from "@/lib/match-live";
import {
  enrichMatchForApi,
  reconcileAndPersistScores,
  repairLiveClockIfNeeded,
  repairMatchPeriodIfNeeded,
  syncMatchClockToNow,
} from "@/services/match-live.service";
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

const PERIOD_EVENT_TYPES: MatchEventType[] = ["KICKOFF", "HALFTIME", "FULLTIME"];

const periodEventsInclude = {
  where: { type: { in: PERIOD_EVENT_TYPES } },
  orderBy: [{ createdAt: "asc" as const }],
  select: { type: true, description: true, minute: true },
};

function mapMatch(
  m: Awaited<ReturnType<typeof fetchMatchRaw>> & {
    events?: MatchEventLike[];
  }
): MatchWithTeams | null {
  if (!m) return null;
  const period = resolveMatchPeriodForDisplay(m, m.events ?? []);
  const elapsed = resolveElapsedSeconds(m);
  const inPenalties =
    period === "PENALTY_SHOOTOUT" ||
    (m.homePenaltyScore > 0 || m.awayPenaltyScore > 0);
  return {
    id: m.id,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homePenaltyScore: m.homePenaltyScore,
    awayPenaltyScore: m.awayPenaltyScore,
    matchPeriod: period,
    minute: m.clockRunning
      ? Math.max(1, Math.ceil(elapsed / 60) || (m.minute ?? 1))
      : m.minute,
    elapsedSeconds: elapsed,
    clockRunning: m.clockRunning,
    clockStartedAt: m.clockStartedAt?.toISOString() ?? null,
    periodLengthMin: m.periodLengthMin,
    periodCount: m.periodCount,
    inPenaltyShootout: inPenalties,
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
    const live = await prisma.match.findMany({
      where: { status: { in: ["LIVE", "HALFTIME"] } },
      select: { id: true },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    });
    await Promise.all(live.map((m) => syncMatchClockToNow(m.id)));

    const matches = await prisma.match.findMany({
      where: { status: { in: ["LIVE", "HALFTIME"] } },
      include: {
        ...matchInclude,
        events: periodEventsInclude,
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    });

    for (const m of matches) {
      await repairMatchPeriodIfNeeded(m);
      await repairLiveClockIfNeeded(m);
    }

    const refreshed = await prisma.match.findMany({
      where: { status: { in: ["LIVE", "HALFTIME"] } },
      include: {
        ...matchInclude,
        events: periodEventsInclude,
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    });

    return refreshed.map((m) => mapMatch(m)!);
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

const matchDetailInclude = {
  ...matchInclude,
  events: {
    orderBy: [{ minute: "asc" as const }, { createdAt: "asc" as const }],
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
};

export type MatchDetailRecord = Prisma.MatchGetPayload<{
  include: typeof matchDetailInclude;
}>;

export async function getMatchById(id: string): Promise<MatchDetailRecord | null> {
  try {
    const match = await prisma.match.findUnique({
      where: { id },
      include: matchDetailInclude,
    });
    if (match) return match;
  } catch {
    // fallback
  }
  return null;
}

export async function getMatchDetailForApi(id: string): Promise<
  ReturnType<typeof enrichMatchForApi<MatchDetailRecord>> | null
> {
  try {
    await syncMatchClockToNow(id);
    const match = await prisma.match.findUnique({
      where: { id },
      include: matchDetailInclude,
    });
    if (!match) return null;
    await repairMatchPeriodIfNeeded(match);
    await repairLiveClockIfNeeded(match);
    await reconcileAndPersistScores(
      id,
      match.homeTeamId,
      match.awayTeamId,
      match.events
    );
    const refreshed = await prisma.match.findUnique({
      where: { id },
      include: matchDetailInclude,
    });
    if (!refreshed) return null;
    return enrichMatchForApi(refreshed);
  } catch {
    return null;
  }
}

export function toMatchWithTeams(m: MatchDetailRecord | null): MatchWithTeams | null;
export function toMatchWithTeams(
  m: ReturnType<typeof enrichMatchForApi<MatchDetailRecord>> | null
): MatchWithTeams | null;
export function toMatchWithTeams(
  m:
    | MatchDetailRecord
    | ReturnType<typeof enrichMatchForApi<MatchDetailRecord>>
    | null
): MatchWithTeams | null {
  if (!m) return null;
  const enriched = "penaltyKicks" in m ? m : null;
  const inPenaltyShootout =
    enriched?.inPenaltyShootout === true ||
    m.matchPeriod === "PENALTY_SHOOTOUT" ||
    m.homePenaltyScore + m.awayPenaltyScore > 0;
  return {
    id: m.id,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homePenaltyScore: m.homePenaltyScore,
    awayPenaltyScore: m.awayPenaltyScore,
    matchPeriod: m.matchPeriod,
    minute: m.minute,
    elapsedSeconds: m.elapsedSeconds,
    clockRunning: m.clockRunning,
    clockStartedAt:
      m.clockStartedAt instanceof Date
        ? m.clockStartedAt.toISOString()
        : (m.clockStartedAt as string | null | undefined) ?? null,
    periodLengthMin: m.periodLengthMin,
    periodCount: m.periodCount,
    inPenaltyShootout,
    penaltyKicks: enriched?.penaltyKicks,
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
