/**
 * IDs únicos no browser — não importa node:crypto (evita bundle no cliente).
 */
export function generateClientId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
