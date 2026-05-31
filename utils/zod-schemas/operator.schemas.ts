import { z } from "zod";

const statsSchema = z
  .object({
    homePossession: z.number().int().min(0).max(100).optional(),
    awayPossession: z.number().int().min(0).max(100).optional(),
    homeShots: z.number().int().min(0).optional(),
    awayShots: z.number().int().min(0).optional(),
    homeShotsOnGoal: z.number().int().min(0).optional(),
    awayShotsOnGoal: z.number().int().min(0).optional(),
    homeFouls: z.number().int().min(0).optional(),
    awayFouls: z.number().int().min(0).optional(),
    homeCorners: z.number().int().min(0).optional(),
    awayCorners: z.number().int().min(0).optional(),
    homeYellowCards: z.number().int().min(0).optional(),
    awayYellowCards: z.number().int().min(0).optional(),
    homeRedCards: z.number().int().min(0).optional(),
    awayRedCards: z.number().int().min(0).optional(),
  })
  .optional();

export const operatorActionSchema = z.object({
  action: z.enum([
    "SET_CLOCK",
    "START_MATCH",
    "HALFTIME",
    "SECOND_HALF",
    "THIRD_HALF",
    "PENALTY_SHOOTOUT",
    "END_MATCH",
    "GOAL_HOME",
    "GOAL_AWAY",
    "GOAL",
    "YELLOW_CARD",
    "RED_CARD",
    "SUBSTITUTION",
    "PENALTY_GOAL",
    "PENALTY_MISS",
    "UPDATE_STATS",
  ]),
  minute: z.number().int().min(0).max(130).optional(),
  extraMinute: z.number().int().min(0).max(30).optional(),
  description: z.string().optional(),
  athleteId: z.string().optional(),
  teamId: z.string().optional(),
  side: z.enum(["home", "away"]).optional(),
  stats: statsSchema,
  periodLengthMin: z.number().int().min(1).max(60).optional(),
  periodCount: z.number().int().min(1).max(5).optional(),
});
