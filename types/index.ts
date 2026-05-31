export type PenaltyKicks = boolean[];

export type ClubPublicMatches = {
  live: MatchWithTeams[];
  upcoming: MatchWithTeams[];
  finished: MatchWithTeams[];
};

export type MatchWithTeams = {
  id: string;
  status: string;
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number;
  awayPenaltyScore?: number;
  matchPeriod?: string | null;
  currentPhase?: string | null;
  currentPhaseIndex?: number;
  phaseDurationSeconds?: number;
  phaseElapsedSeconds?: number;
  phaseStartedAt?: string | null;
  isClockRunning?: boolean;
  periodsConfigured?: boolean;
  totalPeriods?: number;
  hasIntervals?: boolean;
  hasPenaltyShootout?: boolean;
  penaltyBonusPointsEnabled?: boolean;
  matchPeriodLabel?: string | null;
  showTotalGameTime?: boolean;
  minute: number | null;
  elapsedSeconds?: number;
  accumulatedPeriodSeconds?: number;
  clockRunning?: boolean;
  clockStartedAt?: string | null;
  periodLengthMin?: number;
  periodCount?: number;
  inPenaltyShootout?: boolean;
  penaltyKicks?: { home: PenaltyKicks; away: PenaltyKicks };
  scheduledAt: Date;
  venue: string | null;
  round: number;
  championshipName: string | null;
  categoryName: string | null;
  homeTeam: {
    id: string;
    club: {
      id: string;
      name: string;
      shortName: string | null;
      crestUrl: string | null;
    };
  };
  awayTeam: {
    id: string;
    club: {
      id: string;
      name: string;
      shortName: string | null;
      crestUrl: string | null;
    };
  };
};

export type StandingRowDisplay = {
  position: number;
  teamName: string;
  crestUrl: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string | null;
};

export type NewsItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  imageUrl: string | null;
  category: string | null;
  publishedAt: Date | null;
  isFeatured: boolean;
};
