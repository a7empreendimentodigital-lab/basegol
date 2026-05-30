import bcrypt from "bcryptjs";

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$/;

export function isBcryptHash(value: string): boolean {
  return BCRYPT_HASH.test(value);
}

/**
 * Valida senha contra hash bcrypt. Retorna motivo quando inválido (para logs).
 */
export async function verifyPassword(
  plain: string,
  storedHash: string | null | undefined
): Promise<{ ok: true } | { ok: false; reason: "missing_hash" | "invalid_hash" | "mismatch" }> {
  if (!storedHash?.trim()) {
    return { ok: false, reason: "missing_hash" };
  }

  const hash = storedHash.trim();
  if (!isBcryptHash(hash)) {
    return { ok: false, reason: "invalid_hash" };
  }

  try {
    const match = await bcrypt.compare(plain, hash);
    return match ? { ok: true } : { ok: false, reason: "mismatch" };
  } catch {
    return { ok: false, reason: "invalid_hash" };
  }
}

export async function hashPassword(plain: string, rounds = 12): Promise<string> {
  return bcrypt.hash(plain, rounds);
}
