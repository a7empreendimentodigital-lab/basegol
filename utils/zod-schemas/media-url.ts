import { z } from "zod";

/** Aceita URL absoluta (https://) ou caminho local do upload (/uploads/...) */
export function isValidMediaUrl(value: string): boolean {
  if (!value?.trim()) return false;
  if (value.startsWith("/")) return value.length > 1;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const optionalImageUrlNullable = z
  .union([z.string(), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v === "" || v == null ? null : String(v)))
  .refine((v) => v === null || isValidMediaUrl(v), { message: "URL da imagem inválida" });

export const requiredMediaUrl = z
  .string()
  .min(1, "Faça upload do arquivo")
  .refine(isValidMediaUrl, { message: "URL do arquivo inválida" });
