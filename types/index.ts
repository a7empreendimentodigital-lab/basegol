export type MatchWithTeams = {
  id: string;
  status: string;
  homeScore: number;
  awayScore: number;
  minute: number | null;
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
