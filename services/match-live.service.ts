import { prisma } from "@/lib/prisma";
import {
  inferPeriodFromEvents,
  pauseClockData,
  rebuildScoresFromEvents,
  resolveElapsedSeconds,
  type MatchEventLike,
} from "@/lib/match-live";

type MatchWithRelations = {
  id: string;
  status: string;
  matchPeriod: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore: number;
  awayPenaltyScore: number;
  minute: number | null;
  elapsedSeconds: number;
  clockRunning: boolean;
  clockStartedAt: Date | null;
  periodLengthMin: number;
  periodCount: number;
  homeTeamId: string;
  awayTeamId: string;
  events?: MatchEventLike[];
  [key: string]: unknown;
};

export async function syncMatchClockToNow(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match?.clockRunning) return match;

  const elapsed = resolveElapsedSeconds(match);
  const minute = Math.max(
    1,
    Math.min(match.periodLengthMin * match.periodCount, Math.ceil(elapsed / 60) || 1)
  );

  return prisma.match.update({
    where: { id: matchId },
    data: { minute, elapsedSeconds: elapsed },
  });
}

export async function reconcileAndPersistScores(
  matchId: string,
  homeTeamId: string,
  awayTeamId: string,
  events: MatchEventLike[]
) {
  const scores = rebuildScoresFromEvents(events, homeTeamId, awayTeamId);
  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore: scores.homeScore,
      awayScore: scores.awayScore,
      homePenaltyScore: scores.homePenaltyScore,
      awayPenaltyScore: scores.awayPenaltyScore,
    },
  });
  return scores;
}

export function enrichMatchForApi<T extends MatchWithRelations>(match: T) {
  const events = (match.events ?? []) as MatchEventLike[];
  const period =
    match.matchPeriod && match.matchPeriod !== "SCHEDULED"
      ? match.matchPeriod
      : inferPeriodFromEvents(events) ?? match.matchPeriod;

  const elapsed = resolveElapsedSeconds(match);
  const scores = rebuildScoresFromEvents(events, match.homeTeamId, match.awayTeamId);

  const displayMinute = Math.max(
    1,
    Math.min(
      match.periodLengthMin * match.periodCount,
      Math.ceil(elapsed / 60) || (match.minute ?? 1)
    )
  );

  return {
    ...match,
    matchPeriod: period,
    homeScore: scores.homeScore,
    awayScore: scores.awayScore,
    homePenaltyScore: scores.homePenaltyScore,
    awayPenaltyScore: scores.awayPenaltyScore,
    minute: match.clockRunning ? displayMinute : match.minute ?? displayMinute,
    elapsedSeconds: elapsed,
    penaltyKicks: {
      home: scores.homePenaltyKicks,
      away: scores.awayPenaltyKicks,
    },
    inPenaltyShootout:
      period === "PENALTY_SHOOTOUT" ||
      scores.inPenaltyShootout ||
      scores.homePenaltyScore + scores.awayPenaltyScore > 0,
  };
}
