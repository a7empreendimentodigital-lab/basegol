import { z } from "zod";

export const publicMatchesQuerySchema = z.object({
  status: z.enum(["LIVE", "SCHEDULED", "FINISHED", "HALFTIME"]).optional(),
  championshipSlug: z.string().min(1).optional(),
});
