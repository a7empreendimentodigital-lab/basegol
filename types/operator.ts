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
  | "START_MATCH"
  | "HALFTIME"
  | "SECOND_HALF"
  | "END_MATCH"
  | "GOAL_HOME"
  | "GOAL_AWAY"
  | "YELLOW_CARD"
  | "RED_CARD"
  | "SUBSTITUTION"
  | "UPDATE_STATS";
