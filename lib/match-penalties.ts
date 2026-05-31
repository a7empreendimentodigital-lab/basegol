import type { MatchEventLike } from "@/lib/match-live";

export type PenaltyAttemptChar = "O" | "X";

export type PenaltyShootoutScore = {
  homeScore: number;
  awayScore: number;
  homeAttempts: PenaltyAttemptChar[];
  awayAttempts: PenaltyAttemptChar[];
  /** @deprecated use homeAttempts — true = O, false = X */
  homePenaltyKicks: boolean[];
  awayPenaltyKicks: boolean[];
  inPenaltyShootout: boolean;
};

function isPenaltyShootoutKickoff(e: MatchEventLike): boolean {
  const desc = (e.description ?? "").toLowerCase();
  return (
    e.type === "KICKOFF" &&
    (desc.includes("pênalt") || desc.includes("penalt") || desc.includes("disputa"))
  );
}

function indexOfFirstPenaltyShootoutEvent(events: MatchEventLike[]): number {
  return events.findIndex(
    (e) =>
      e.type === "PENALTY_GOAL" ||
      e.type === "PENALTY_MISS" ||
      isPenaltyShootoutKickoff(e)
  );
}

export function sortEventsForScoring(events: MatchEventLike[]): MatchEventLike[] {
  return [...events].sort((a, b) => {
    const ma = a.minute ?? 0;
    const mb = b.minute ?? 0;
    if (ma !== mb) return ma - mb;
    const ca =
      a.createdAt instanceof Date
        ? a.createdAt.getTime()
        : a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;
    const cb =
      b.createdAt instanceof Date
        ? b.createdAt.getTime()
        : b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;
    return ca - cb;
  });
}

function resolveSide(
  e: MatchEventLike,
  homeTeamId: string,
  awayTeamId: string
): "home" | "away" | null {
  if (e.teamId === homeTeamId) return "home";
  if (e.teamId === awayTeamId) return "away";
  return null;
}

export function countConvertedAttempts(attempts: PenaltyAttemptChar[]): number {
  return attempts.filter((a) => a === "O").length;
}

export function attemptsToBooleans(attempts: PenaltyAttemptChar[]): boolean[] {
  return attempts.map((a) => a === "O");
}

export function formatAttemptsSequence(attempts: PenaltyAttemptChar[]): string {
  return attempts.join("");
}

/** Reconstrói cobranças e placar de pênaltis somente a partir de eventos. */
export function rebuildPenaltyShootoutFromEvents(
  events: MatchEventLike[],
  homeTeamId: string,
  awayTeamId: string
): PenaltyShootoutScore {
  const sorted = sortEventsForScoring(events);
  const firstIdx = indexOfFirstPenaltyShootoutEvent(sorted);
  const homeAttempts: PenaltyAttemptChar[] = [];
  const awayAttempts: PenaltyAttemptChar[] = [];

  if (firstIdx < 0) {
    return {
      homeScore: 0,
      awayScore: 0,
      homeAttempts,
      awayAttempts,
      homePenaltyKicks: [],
      awayPenaltyKicks: [],
      inPenaltyShootout: false,
    };
  }

  let shootoutStarted = false;

  for (let i = firstIdx; i < sorted.length; i++) {
    const e = sorted[i];
    if (isPenaltyShootoutKickoff(e)) {
      shootoutStarted = true;
      continue;
    }

    const side = resolveSide(e, homeTeamId, awayTeamId);
    if (!side) continue;

    const isPenaltyEvent =
      e.type === "PENALTY_GOAL" || e.type === "PENALTY_MISS";
    const isGoalInShootout = e.type === "GOAL" && shootoutStarted;

    if (!isPenaltyEvent && !isGoalInShootout) continue;

    if (!shootoutStarted && isPenaltyEvent) {
      shootoutStarted = true;
    }

    if (e.type === "PENALTY_GOAL" || (e.type === "GOAL" && shootoutStarted)) {
      if (side === "home") homeAttempts.push("O");
      else awayAttempts.push("O");
    } else if (e.type === "PENALTY_MISS") {
      if (side === "home") homeAttempts.push("X");
      else awayAttempts.push("X");
    }
  }

  const homeScore = countConvertedAttempts(homeAttempts);
  const awayScore = countConvertedAttempts(awayAttempts);

  return {
    homeScore,
    awayScore,
    homeAttempts,
    awayAttempts,
    homePenaltyKicks: attemptsToBooleans(homeAttempts),
    awayPenaltyKicks: attemptsToBooleans(awayAttempts),
    inPenaltyShootout:
      firstIdx >= 0 || homeAttempts.length > 0 || awayAttempts.length > 0,
  };
}

export function penaltyShootoutWinner(
  homeScore: number,
  awayScore: number
): "home" | "away" | "draw" | null {
  if (homeScore === awayScore) return "draw";
  return homeScore > awayScore ? "home" : "away";
}
