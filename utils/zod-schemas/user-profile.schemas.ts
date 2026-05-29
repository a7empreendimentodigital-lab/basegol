import { z } from "zod";

export const userProfileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(120).optional(),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  image: z
    .union([
      z
        .string()
        .min(1)
        .refine((v) => v.startsWith("/") || v.startsWith("http"), "URL de imagem inválida"),
      z.null(),
    ])
    .optional(),
});

export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
