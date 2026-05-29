import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8).max(100),
});

export const firstAccessChangePasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Mínimo 8 caracteres").max(100),
    confirmPassword: z.string().min(8, "Confirme a nova senha"),
    currentPassword: z.string().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
