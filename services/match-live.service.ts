import { prisma } from "@/lib/prisma";
import {
  rebuildScoresFromEvents,
  resolveElapsedSeconds,
  resolveMatchPeriodForDisplay,
  shouldMatchClockBeRunning,
  type MatchEventLike,
} from "@/lib/match-live";
import type { MatchPeriod } from "@prisma/client";

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
  accumulatedPeriodSeconds: number;
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

  const now = new Date();
  const elapsed = resolveElapsedSeconds(match, now);
  const minute = Math.max(1, Math.ceil(elapsed / 60) || match.minute || 1);

  return prisma.match.update({
    where: { id: matchId },
    data: {
      minute,
      elapsedSeconds: elapsed,
      clockStartedAt: now,
    },
  });
}

/** Relógio parado indevidamente durante um tempo — retoma a contagem. */
export async function repairLiveClockIfNeeded(
  match: MatchWithRelations & { events?: MatchEventLike[] }
) {
  const events = match.events ?? [];
  const period = resolveMatchPeriodForDisplay(match, events);
  if (!shouldMatchClockBeRunning(match.status, period) || match.clockRunning) return;

  const now = new Date();
  await prisma.match.update({
    where: { id: match.id },
    data: {
      clockRunning: true,
      clockStartedAt: now,
    },
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

/** Corrige `matchPeriod` no banco quando eventos indicam período mais avançado. */
export async function repairMatchPeriodIfNeeded(
  match: MatchWithRelations & { events?: MatchEventLike[] }
) {
  const events = match.events ?? [];
  const resolved = resolveMatchPeriodForDisplay(match, events);
  const stored = match.matchPeriod;
  if (
    resolved &&
    resolved !== stored &&
    resolved !== "SCHEDULED" &&
    stored !== "FINISHED"
  ) {
    await prisma.match.update({
      where: { id: match.id },
      data: { matchPeriod: resolved as MatchPeriod },
    });
  }
}

export function enrichMatchForApi<T extends MatchWithRelations>(match: T) {
  const events = (match.events ?? []) as MatchEventLike[];
  const period = resolveMatchPeriodForDisplay(match, events);

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
    clockStartedAt:
      match.clockStartedAt instanceof Date
        ? match.clockStartedAt.toISOString()
        : match.clockStartedAt,
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
