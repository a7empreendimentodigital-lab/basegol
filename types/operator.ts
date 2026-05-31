export type OperatorMatchListItem = {
  id: string;
  status: string;
  minute: number | null;
  homeScore: number;
  awayScore: number;
  homeTeam: { club: { name: string } };
  awayTeam: { club: { name: string } };
};

export type OperatorAction =
  | "SET_MATCH_CONFIG"
  | "GO_TO_PHASE"
  | "PAUSE_CLOCK"
  | "RESUME_CLOCK"
  | "START_MATCH"
  | "HALFTIME"
  | "SECOND_HALF"
  | "THIRD_HALF"
  | "PENALTY_SHOOTOUT"
  | "END_MATCH"
  | "GOAL_HOME"
  | "GOAL_AWAY"
  | "GOAL"
  | "YELLOW_CARD"
  | "RED_CARD"
  | "SUBSTITUTION"
  | "PENALTY_GOAL"
  | "PENALTY_MISS"
  | "SET_PENALTY_SCORE"
  | "UPDATE_STATS";
