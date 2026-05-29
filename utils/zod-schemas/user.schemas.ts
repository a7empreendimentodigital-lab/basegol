import { z } from "zod";

const roleSlugEnum = z.enum([
  "SUPER_ADMIN",
  "ADMIN_LIGA",
  "CLUBE",
  "OPERADOR_DE_PARTIDA",
  "SCOUT",
  "VISITANTE",
]);

export const userCreateSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    roleSlug: roleSlugEnum,
    status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "BANNED"]).default("ACTIVE"),
    clubId: z.string().optional().nullable(),
    assignedMatchIds: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.roleSlug === "CLUBE" && !data.clubId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione o clube para usuários do setor Clube",
        path: ["clubId"],
      });
    }
  });

export const userUpdateSchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    roleSlug: roleSlugEnum.optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "BANNED"]).optional(),
    clubId: z.string().optional().nullable(),
    assignedMatchIds: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.roleSlug === "CLUBE" && data.clubId === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione o clube para usuários do setor Clube",
        path: ["clubId"],
      });
    }
  });
