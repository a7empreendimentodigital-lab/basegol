export type PaulistaCompetition = {
  competition_id: string;
  name: string;
  season: number;
  category: string;
  source?: string;
};

export type PaulistaGroupTeam = {
  competition_category: string;
  group: number;
  official_name: string;
  alias: string;
};

export type PaulistaFixture = {
  competition_id: string;
  category: string;
  round: number;
  match_number: number;
  date: string;
  weekday?: string;
  time: string;
  home_alias: string;
  home_official: string;
  away_alias: string;
  away_official: string;
  venue: string;
  status: string;
  raw_line?: string;
};

export type PaulistaPack = {
  season: number;
  competitions: PaulistaCompetition[];
  groupTeams: PaulistaGroupTeam[];
  fixtures: PaulistaFixture[];
};
