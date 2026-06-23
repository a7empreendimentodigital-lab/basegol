import { randomBytes, randomUUID } from "node:crypto";

/**
 * UUID v4 via módulo Node.js — compatível com VPS Ubuntu (sem Web Crypto global).
 */
export function generateId(): string {
  return randomUUID();
}

/** Fallback se randomUUID não estiver disponível (Node muito antigo). */
export function generateIdSafe(): string {
  try {
    return randomUUID();
  } catch {
    return randomBytes(16).toString("hex");
  }
}

export function generateUploadStem(): string {
  return `${Date.now()}-${generateIdSafe()}`;
}
