import { z } from "zod";

export const sumulaMetaSchema = z.object({
  referee: z.string().optional(),
  assistant1: z.string().optional(),
  assistant2: z.string().optional(),
  fourthOfficial: z.string().optional(),
  ambulanceDoctor: z.string().optional(),
  delayReason: z.string().optional(),
  addedTimeReason: z.string().optional(),
  observations: z.string().optional(),
  assistantReport: z.string().optional(),
  eventualObservations: z.string().optional(),
  newBallsProvided: z.boolean().optional(),
});

export type SumulaMeta = z.infer<typeof sumulaMetaSchema>;
