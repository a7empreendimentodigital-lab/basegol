import { z } from "zod";

export const clubAthleteCreateSchema = z.object({
  clubId: z.string().cuid().optional(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  birthDate: z.string(),
  position: z.enum(["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF"]),
  shirtNumber: z.number().int().min(1).max(99).optional(),
  category: z.string().optional(),
});

export const clubAthleteUpdateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  shirtNumber: z.number().int().min(1).max(99).nullable().optional(),
  category: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INJURED", "SUSPENDED", "INACTIVE", "PENDING_DOCS"]).optional(),
});
