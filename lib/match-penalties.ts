import type { MatchEventLike } from "@/lib/match-live";

export type PenaltyAttemptChar = "O" | "X";

export type PenaltyShootoutScore = {
  homeScore: number;
  awayScore: number;
  homeAttempts: PenaltyAttemptChar[];
  awayAttempts: PenaltyAttemptChar[];
  /** true = convertido (O), false = perdido (X) */
  homePenaltyKicks: boolean[];
  awayPenaltyKicks: boolean[];
  inPenaltyShootout: boolean;
};

/** Normaliza JSON/string/array do banco para sequência O/X. */
export function parsePenaltyAttempts(raw: unknown): PenaltyAttemptChar[] {
  if (raw == null) return [];

  if (typeof raw === "string") {
    const trimmed = raw.trim().toUpperCase();
    if (trimmed.startsWith("[")) {
      try {
        return parsePenaltyAttempts(JSON.parse(trimmed));
      } catch {
        return [];
      }
    }
    return trimmed
      .split("")
      .filter((c): c is PenaltyAttemptChar => c === "O" || c === "X");
  }

  if (Array.isArray(raw)) {
    const out: PenaltyAttemptChar[] = [];
    for (const item of raw) {
      if (item === true || item === "O" || item === "o") out.push("O");
      else if (item === false || item === "X" || item === "x") out.push("X");
    }
    return out;
  }

  return [];
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

function isPenaltyShootoutKickoff(e: MatchEventLike): boolean {
  const desc = (e.description ?? "").toLowerCase();
  return (
    e.type === "KICKOFF" &&
    (desc.includes("pênalt") || desc.includes("penalt") || desc.includes("disputa"))
  );
}

export function eventCreatedAtMs(e: MatchEventLike): number {
  if (e.createdAt instanceof Date) return e.createdAt.getTime();
  if (e.createdAt) {
    const t = new Date(e.createdAt).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

/** Início da disputa de pênaltis pela ordem real (createdAt), não pelo minuto do evento. */
export function getPenaltyShootoutStartMs(events: MatchEventLike[]): number | null {
  let start: number | null = null;
  for (const e of events) {
    const isStart =
      e.type === "PENALTY_GOAL" ||
      e.type === "PENALTY_MISS" ||
      isPenaltyShootoutKickoff(e);
    if (!isStart) continue;
    const t = eventCreatedAtMs(e);
    if (start === null || t < start) start = t;
  }
  return start;
}

/** Gol de campo antes do apito da disputa; cobranças usam o mesmo limite com tipos PENALTY_*. */
export function isEventInPenaltyShootout(
  e: MatchEventLike,
  shootoutStartMs: number | null
): boolean {
  if (shootoutStartMs === null) return false;
  if (e.type === "GOAL") {
    return eventCreatedAtMs(e) >= shootoutStartMs;
  }
  return (
    (e.type === "PENALTY_GOAL" || e.type === "PENALTY_MISS") &&
    eventCreatedAtMs(e) >= shootoutStartMs
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

/** Reconstrói cobranças e placar de pênaltis somente a partir de eventos. */
export function rebuildPenaltyShootoutFromEvents(
  events: MatchEventLike[],
  homeTeamId: string,
  awayTeamId: string
): PenaltyShootoutScore {
  const shootoutStartMs = getPenaltyShootoutStartMs(events);
  if (shootoutStartMs === null) {
    return emptyPenaltyScore();
  }

  const homeAttempts: PenaltyAttemptChar[] = [];
  const awayAttempts: PenaltyAttemptChar[] = [];

  const chronological = [...events].sort(
    (a, b) => eventCreatedAtMs(a) - eventCreatedAtMs(b)
  );

  for (const e of chronological) {
    if (!isEventInPenaltyShootout(e, shootoutStartMs)) continue;
    if (e.type !== "PENALTY_GOAL" && e.type !== "PENALTY_MISS") continue;

    const side = resolveSide(e, homeTeamId, awayTeamId);
    if (!side) continue;

    if (e.type === "PENALTY_GOAL") {
      if (side === "home") homeAttempts.push("O");
      else awayAttempts.push("O");
    } else if (e.type === "PENALTY_MISS") {
      if (side === "home") homeAttempts.push("X");
      else awayAttempts.push("X");
    }
  }

  return buildPenaltyScoreFromAttempts(homeAttempts, awayAttempts, true);
}

export function buildPenaltyScoreFromAttempts(
  homeAttempts: PenaltyAttemptChar[],
  awayAttempts: PenaltyAttemptChar[],
  inPenaltyShootout = true
): PenaltyShootoutScore {
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
      inPenaltyShootout &&
      (homeAttempts.length > 0 ||
        awayAttempts.length > 0 ||
        homeScore + awayScore > 0),
  };
}

function emptyPenaltyScore(): PenaltyShootoutScore {
  return {
    homeScore: 0,
    awayScore: 0,
    homeAttempts: [],
    awayAttempts: [],
    homePenaltyKicks: [],
    awayPenaltyKicks: [],
    inPenaltyShootout: false,
  };
}

/**
 * Placar de pênaltis: eventos ao vivo têm prioridade quando há mais cobranças;
 * arrays só no banco (ex.: correção manual) valem quando não há eventos ou são mais completos.
 */
export function resolvePenaltyShootoutData(
  events: MatchEventLike[],
  homeTeamId: string,
  awayTeamId: string,
  storedHome?: unknown,
  storedAway?: unknown
): PenaltyShootoutScore {
  const fromEvents = rebuildPenaltyShootoutFromEvents(
    events,
    homeTeamId,
    awayTeamId
  );

  const parsedHome = parsePenaltyAttempts(storedHome);
  const parsedAway = parsePenaltyAttempts(storedAway);

  const eventCount =
    fromEvents.homeAttempts.length + fromEvents.awayAttempts.length;
  const storedCount = parsedHome.length + parsedAway.length;

  if (eventCount > 0 && eventCount >= storedCount) {
    return fromEvents;
  }

  if (storedCount > 0) {
    return buildPenaltyScoreFromAttempts(parsedHome, parsedAway, true);
  }

  return fromEvents;
}

export function penaltyShootoutWinner(
  homeScore: number,
  awayScore: number
): "home" | "away" | "draw" | null {
  if (homeScore === awayScore) return "draw";
  return homeScore > awayScore ? "home" : "away";
}

/** Sequência correta: Bebedouro (mandante) x LG Futebol (visitante). */
export const BEBEDOURO_LG_PENALTY_REFERENCE = {
  homeAttempts: ["O", "X", "O", "O", "O", "O", "X"] as PenaltyAttemptChar[],
  awayAttempts: ["O", "O", "X", "O", "O", "O", "O"] as PenaltyAttemptChar[],
};
