import { z } from "zod";

export const championshipSponsorPlacementEnum = z.enum(["SIDEBAR_LEFT", "SIDEBAR_RIGHT"]);

export const championshipSponsorCreateSchema = z.object({
  name: z.string().min(1).max(120),
  logoUrl: z.string().optional().nullable(),
  linkUrl: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      const t = v?.trim();
      if (!t) return null;
      return t;
    }),
  placement: championshipSponsorPlacementEnum.default("SIDEBAR_RIGHT"),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const championshipSponsorUpdateSchema = championshipSponsorCreateSchema.partial();

export const championshipMemberCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  roleSlug: z.enum(["ADMIN_CAMPEONATO", "OPERADOR_DE_PARTIDA"]),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "BANNED"]).default("ACTIVE"),
  assignedMatchIds: z.array(z.string()).optional(),
});
