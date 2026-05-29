import { z } from "zod";
import { athleteSchema, documentSchema } from "@/utils/zod-schemas/admin-entities";
import { optionalImageUrlNullable } from "@/utils/zod-schemas/media-url";

export const clubAthletePortalSchema = athleteSchema.omit({ clubId: true });

export const staffMemberSchema = z.object({
  name: z.string().min(2),
  role: z.enum(["HEAD_COACH", "ASSISTANT_COACH", "GOALKEEPER_COACH", "PHYSIO", "ANALYST", "MANAGER"]),
  photoUrl: optionalImageUrlNullable,
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  license: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const clubDocumentPortalSchema = documentSchema.omit({ clubId: true });

export const clubRegistrationSchema = z.object({
  championshipId: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"]).default("PENDING"),
});

export const clubProfileSchema = z.object({
  name: z.string().min(2).optional(),
  shortName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  description: z.string().optional(),
  crestUrl: optionalImageUrlNullable,
  bannerUrl: optionalImageUrlNullable,
});

export const CLUB_ENTITY_SCHEMAS: Record<string, z.ZodObject<z.ZodRawShape>> = {
  athletes: clubAthletePortalSchema,
  staff: staffMemberSchema,
  documents: clubDocumentPortalSchema,
  registrations: clubRegistrationSchema,
};
